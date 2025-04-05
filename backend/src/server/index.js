const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { monitor } = require('@colyseus/monitor');
const path = require('path');

// Import room handlers
const { HistoryRoom } = require('../game/HistoryRoom');

// Import database setup
const db = require('../models/database');

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Static files (for production)
app.use(express.static(path.join(__dirname, '../../../frontend/dist')));

// Server info endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API routes for game data
app.get('/api/characters', (req, res) => {
  // In a real app, this would fetch from the database
  db.getCharacters()
    .then(characters => {
      res.json({ characters });
    })
    .catch(err => {
      console.error('Error fetching characters:', err);
      res.status(500).json({ error: 'Failed to fetch characters' });
    });
});

// Create HTTP server
const server = http.createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register room handlers
gameServer.define('history_room', HistoryRoom);

// Register Colyseus monitor (admin panel)
app.use('/colyseus', monitor());

// Serve frontend for any other route (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../frontend/dist/index.html'));
});

// Listen on port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Colyseus monitor available at http://localhost:${PORT}/colyseus`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  gameServer.gracefullyShutdown()
    .then(() => {
      console.log('Colyseus server shut down successfully');
      db.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
}); 