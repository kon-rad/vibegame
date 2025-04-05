const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to SQLite database file
const dbPath = path.join(dataDir, 'gameframe.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    return;
  }
  console.log('Connected to SQLite database at', dbPath);
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Initialize database schema
  initializeDatabase();
});

// Initialize database schema
function initializeDatabase() {
  // Create tables if they don't exist
  const schema = `
    -- Characters table
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      era TEXT NOT NULL,
      bio TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Conversations table
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      character_id INTEGER NOT NULL,
      title TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
    );
    
    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL, -- 'user' or 'character'
      message_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
    );
  `;
  
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating database schema:', err);
      return;
    }
    console.log('Database schema initialized');
    
    // Insert default characters if table is empty
    db.get('SELECT COUNT(*) as count FROM characters', (err, row) => {
      if (err) {
        console.error('Error checking characters table:', err);
        return;
      }
      
      if (row.count === 0) {
        insertDefaultCharacters();
      }
    });
  });
}

// Insert default historical characters
function insertDefaultCharacters() {
  const characters = [
    {
      name: 'Socrates',
      era: 'Ancient Greece, 470-399 BCE',
      bio: 'Classical Greek philosopher credited as the founder of Western philosophy. Known for the Socratic method and his student Plato. Sentenced to death for "corrupting the youth" of Athens.',
      avatar: '/assets/avatars/socrates.jpg'
    },
    {
      name: 'Leonardo da Vinci',
      era: 'Renaissance Italy, 1452-1519',
      bio: 'Italian polymath of the Renaissance whose areas of interest included invention, drawing, painting, sculpting, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, writing, history, and cartography. Known for the Mona Lisa and The Last Supper.',
      avatar: '/assets/avatars/davinci.jpg'
    },
    {
      name: 'Marie Curie',
      era: 'Modern Poland/France, 1867-1934',
      bio: 'Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. The first woman to win a Nobel Prize, the first person to win Nobel Prizes in multiple scientific fields, and the first woman to become a professor at the University of Paris.',
      avatar: '/assets/avatars/curie.jpg'
    }
  ];
  
  const stmt = db.prepare('INSERT INTO characters (name, era, bio, avatar) VALUES (?, ?, ?, ?)');
  
  characters.forEach(character => {
    stmt.run(character.name, character.era, character.bio, character.avatar, (err) => {
      if (err) {
        console.error(`Error inserting character ${character.name}:`, err);
      }
    });
  });
  
  stmt.finalize();
  console.log('Default characters inserted');
}

// Database API
const database = {
  // Get all historical characters
  getCharacters: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM characters ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },
  
  // Get a specific character by ID
  getCharacter: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM characters WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },
  
  // Save a conversation
  saveConversation: (userId, characterId, title = 'Untitled Conversation') => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO conversations (user_id, character_id, title) VALUES (?, ?, ?)',
        [userId, characterId, title],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },
  
  // Add a message to a conversation
  addMessage: (conversationId, senderType, messageText) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO messages (conversation_id, sender_type, message_text) VALUES (?, ?, ?)',
        [conversationId, senderType, messageText],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },
  
  // Get messages from a conversation
  getConversationMessages: (conversationId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at',
        [conversationId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  },
  
  // Close database connection
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
          return;
        }
        console.log('Database connection closed');
        resolve();
      });
    });
  }
};

module.exports = database; 