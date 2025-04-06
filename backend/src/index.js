const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { Server: ColyseusServer } = require('colyseus');
const { monitor } = require('@colyseus/monitor');
const cors = require('cors');
const path = require('path');

// Import routes
const environmentRoutes = require('./routes/environment');
const { router: conversationRoutes } = require('./routes/conversation');

// Import room handlers
const { HistoryRoom } = require('./game/HistoryRoom');

// Import database setup
const db = require('./models/database');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());

// Static files
// Serve static assets (avatars, etc)
app.use(express.static(path.join(__dirname, '../public')));
// In production, also serve the frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// API routes
app.use('/api/environment', environmentRoutes);
app.use('/api/conversation', conversationRoutes);

// Server info endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

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

// Register room handlers
gameServer.define('history_room', HistoryRoom);

// Register Colyseus monitor (admin panel)
// In production, this could be protected with authentication
app.use('/colyseus', monitor());

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

// In production, serve the frontend for any other route (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- HTTP API: http://localhost:${PORT}/api`);
  console.log(`- WebSocket (Socket.IO): ws://localhost:${PORT}`);
  console.log(`- WebSocket (Colyseus): ws://localhost:${PORT}/colyseus`);
  console.log(`- Colyseus monitor: http://localhost:${PORT}/colyseus`);
  console.log(`- AI Movement Test: http://localhost:${PORT}/api/conversation/test-movement (POST)`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  gameServer.gracefullyShutdown()
    .then(() => {
      console.log('Colyseus server shut down successfully');
      // Close database connections
      db.close && db.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
}); 