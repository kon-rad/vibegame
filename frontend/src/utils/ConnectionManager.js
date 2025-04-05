import { Client } from 'colyseus.js';
import io from 'socket.io-client';

class ConnectionManager {
  constructor() {
    this.client = null;
    this.room = null;
    this.socket = null;
    this.connected = false;
    
    // Initialize connections
    this.initializeClient();
    this.initializeSocket();
  }
  
  initializeClient() {
    // Setup Colyseus client
    const protocol = window.location.protocol.replace('http', 'ws');
    const endpoint = `${protocol}//${window.location.hostname}:3001`;
    
    try {
      this.client = new Client(endpoint);
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
    } catch (error) {
      console.error('Failed to initialize socket.io:', error);
    }
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
  
  sendMessage(characterId, message) {
    if (!this.room) {
      console.error('Not connected to a room');
      return false;
    }
    
    try {
      this.room.send('message', { 
        characterId, 
        message,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
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