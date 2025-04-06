import { Client } from 'colyseus.js';
import io from 'socket.io-client';

class ConnectionManager {
  constructor() {
    this.client = null;
    this.room = null;
    this.socket = null;
    this.connected = false;
    this.environmentData = null;
    
    // Initialize connections
    this.initializeClient();
    this.initializeSocket();
    this.fetchEnvironmentData();
  }
  
  initializeClient() {
    // Setup Colyseus client
    const protocol = window.location.protocol.replace('http', 'ws');
    const endpoint = `${protocol}//${window.location.hostname}:3001`;
    
    try {
      this.client = new Client(endpoint + '/colyseus');
      console.log('Colyseus client initialized');
    } catch (error) {
      console.error('Failed to initialize Colyseus client:', error);
    }
  }
  
  initializeSocket() {
    // Setup Socket.io for non-game related communications
    try {
      this.socket = io('http://localhost:3001');
      
      this.socket.on('connect', () => {
        console.log('Socket.io connected');
        this.connected = true;
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket.io disconnected');
        this.connected = false;
      });
      
      // Listen for messages
      this.socket.on('message', (data) => {
        console.log('Received message:', data);
      });
    } catch (error) {
      console.error('Failed to initialize socket.io:', error);
    }
  }
  
  async fetchEnvironmentData() {
    try {
      const response = await fetch('http://localhost:3001/api/environment');
      if (response.ok) {
        this.environmentData = await response.json();
        console.log('Environment data loaded:', this.environmentData);
      } else {
        console.error('Failed to fetch environment data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching environment data:', error);
    }
  }
  
  getEnvironmentData() {
    return this.environmentData;
  }
  
  getCharacters() {
    return this.environmentData?.characters || [];
  }
  
  async joinGameRoom(roomName = 'history_room', options = {}) {
    if (!this.client) {
      console.error('Colyseus client not initialized');
      return null;
    }
    
    try {
      this.room = await this.client.joinOrCreate(roomName, options);
      
      this.room.onStateChange((state) => {
        console.log('Room state changed:', state);
      });
      
      this.room.onMessage('message', (message) => {
        console.log('Message from room:', message);
      });
      
      this.room.onLeave((code) => {
        console.log('Left room:', code);
        this.room = null;
      });
      
      console.log('Joined room:', roomName);
      return this.room;
    } catch (error) {
      console.error('Error joining room:', error);
      return null;
    }
  }
  
  async sendMessage(characterId, message) {
    // Try to send through the room first
    if (this.room) {
      try {
        this.room.send('message', { 
          characterId, 
          message,
          timestamp: Date.now()
        });
        return { success: true, channel: 'colyseus' };
      } catch (error) {
        console.error('Error sending message through Colyseus:', error);
      }
    }
    
    // Fall back to REST API
    try {
      const response = await fetch('http://localhost:3001/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterId, message }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, channel: 'api', data };
      } else {
        console.error('Error sending message through API:', response.statusText);
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      console.error('Network error sending message:', error);
      return { success: false, error: error.message };
    }
  }
  
  listenForMessages(callback) {
    if (!this.room) {
      console.error('Not connected to a room');
      return () => {};
    }
    
    const listener = this.room.onMessage('message', (message) => {
      callback(message);
    });
    
    return () => {
      listener.remove();
    };
  }
  
  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    console.log('Disconnected from server');
  }
}

export default ConnectionManager; 