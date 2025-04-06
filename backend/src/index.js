const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { Server: ColyseusServer } = require('colyseus');
const cors = require('cors');
const path = require('path');

// Import routes
const environmentRoutes = require('./routes/environment');
const conversationRoutes = require('./routes/conversation');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/environment', environmentRoutes);
app.use('/api/conversation', conversationRoutes);

// Serve avatar images
app.use('/assets/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Colyseus
const gameServer = new ColyseusServer({
  transport: new WebSocketTransport({
    server,
    path: '/colyseus'
  })
});

// Define a Colyseus room for our application
const { Room } = require('colyseus');

class HistoryRoom extends Room {
  onCreate(options) {
    console.log('History room created!', options);
    
    this.setState({
      characters: require('./config/environmentConfig').characters,
      messages: []
    });
    
    this.onMessage('message', (client, data) => {
      console.log('Message received:', data);
      const { characterId, message } = data;
      
      // Find the character
      const character = this.state.characters.find(c => c.id === characterId);
      
      if (!character) {
        return;
      }
      
      // Add message to state
      this.state.messages.push({
        id: this.state.messages.length + 1,
        userId: client.sessionId,
        characterId,
        text: message,
        timestamp: new Date().toISOString()
      });
      
      // Generate a response (in a real app, this would call an AI API)
      setTimeout(() => {
        const responseText = `${character.name} is thinking about your message...`;
        
        // Add response to state
        this.state.messages.push({
          id: this.state.messages.length + 1,
          userId: 'ai',
          characterId,
          text: responseText,
          timestamp: new Date().toISOString()
        });
        
        // Broadcast response to all clients
        this.broadcast('message', {
          character: character.name,
          message: responseText,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }
  
  onJoin(client, options) {
    console.log(`Client ${client.sessionId} joined the room`);
  }
  
  onLeave(client, consented) {
    console.log(`Client ${client.sessionId} left the room`);
  }
}

// Register the room
gameServer.define('history_room', HistoryRoom);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  // Simple echo for testing
  socket.on('message', (data) => {
    console.log('Socket.IO message received:', data);
    socket.emit('message', {
      sender: 'server',
      text: `Echo: ${data.text}`,
      timestamp: new Date().toISOString()
    });
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- HTTP API: http://localhost:${PORT}/api`);
  console.log(`- WebSocket (Socket.IO): ws://localhost:${PORT}`);
  console.log(`- WebSocket (Colyseus): ws://localhost:${PORT}/colyseus`);
}); 