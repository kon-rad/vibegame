const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Seed database with default characters if needed
async function initializeCharacters() {
  try {
    // Check if characters table is empty
    const characterCount = await prisma.character.count();
    
    if (characterCount === 0) {
      console.log('Seeding database with default characters...');
      
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
      
      // Create all characters
      await prisma.character.createMany({
        data: characters
      });
      
      console.log('Default characters inserted successfully');
    }
  } catch (error) {
    console.error('Error initializing characters:', error);
  }
}

// Initialize characters on startup
initializeCharacters();

// Database API
const database = {
  // Get all historical characters
  getCharacters: async () => {
    try {
      return await prisma.character.findMany({
        orderBy: {
          name: 'asc'
        }
      });
    } catch (error) {
      console.error('Error getting characters:', error);
      return [];
    }
  },
  
  // Get a specific character by ID
  getCharacter: async (id) => {
    try {
      return await prisma.character.findUnique({
        where: {
          id: Number(id)
        }
      });
    } catch (error) {
      console.error(`Error getting character with ID ${id}:`, error);
      return null;
    }
  },
  
  // Save a conversation
  saveConversation: async (userId, characterId, title = 'Untitled Conversation') => {
    try {
      // First, ensure the character exists
      const character = await prisma.character.findUnique({
        where: { id: Number(characterId) }
      });

      if (!character) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      // If userId is provided, ensure the user exists or create a default one
      let userIdToUse = null;
      if (userId) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id: Number(userId) }
        });

        if (existingUser) {
          userIdToUse = existingUser.id;
        } else {
          // Create a new user if not found
          console.log(`User ID ${userId} not found. Creating default user.`);
          const newUser = await prisma.user.create({
            data: {
              id: Number(userId),
              username: `user_${userId}`,
              email: `user_${userId}@example.com`
            }
          });
          userIdToUse = newUser.id;
        }
      }

      // Create conversation with validated user and character
      // Use the default title if title is null
      const conversationData = {
        characterId: Number(characterId),
        userId: userIdToUse
      };
      
      // Only add title if it's not null (prisma doesn't accept null)
      if (title !== null) {
        conversationData.title = title;
      }
      
      const conversation = await prisma.conversation.create({
        data: conversationData
      });
      
      return { id: conversation.id };
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  },
  
  // Add a message to a conversation
  addMessage: async (conversationId, senderType, messageText) => {
    try {
      const message = await prisma.message.create({
        data: {
          text: messageText,
          senderType,
          conversationId: Number(conversationId)
        }
      });
      
      return { id: message.id };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },
  
  // Get messages from a conversation
  getConversationMessages: async (conversationId) => {
    try {
      return await prisma.message.findMany({
        where: {
          conversationId: Number(conversationId)
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    } catch (error) {
      console.error(`Error getting messages for conversation ${conversationId}:`, error);
      return [];
    }
  },
  
  // Close database connection
  close: async () => {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  },
  
  // Get Prisma client (for direct access if needed)
  getPrisma: () => prisma
};

// Handle shutdown
process.on('SIGINT', async () => {
  await database.close();
  process.exit(0);
});

module.exports = database; 