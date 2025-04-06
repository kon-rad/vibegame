const express = require('express');
const router = express.Router();
const AIService = require('../game/AIService');
const database = require('../models/database');

// Initialize AIService
const aiService = new AIService();

/**
 * POST /api/conversation
 * Handles a conversation message and returns a response
 */
router.post('/', async (req, res) => {
  const { characterId, message, userId, conversationId } = req.body;
  
  if (!characterId || !message) {
    return res.status(400).json({ error: 'Character ID and message are required' });
  }
  
  try {
    // Find the character
    const character = await database.getCharacter(characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    let conversationHistory = [];
    
    // If continuing an existing conversation, fetch the history
    if (conversationId) {
      try {
        conversationHistory = await database.getConversationMessages(conversationId);
      } catch (err) {
        console.warn(`Error fetching conversation history for ID ${conversationId}:`, err);
        // Continue with empty history if conversation not found
      }
    }
    
    // Generate a response using AIService
    const response = await aiService.generateResponse(characterId, message, conversationHistory);
    
    // Save to conversation history
    const title = conversationId ? null : `Conversation with ${character.name}`;
    const savedConversationId = await aiService.addConversationToHistory(
      userId, 
      characterId, 
      title, 
      message, 
      response
    );
    
    res.json({
      character: character.name,
      message: response,
      timestamp: new Date().toISOString(),
      conversationId: savedConversationId || conversationId
    });
  } catch (error) {
    console.error('Error processing conversation:', error);
    res.status(500).json({ error: 'Failed to process conversation' });
  }
});

/**
 * GET /api/conversation/user/:userId
 * Get all conversations for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const conversations = await database.getPrisma().conversation.findMany({
      where: { userId },
      include: { 
        character: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get only the last message for preview
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/conversation/:conversationId
 * Get a specific conversation with all messages
 */
router.get('/:conversationId', async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    const conversation = await database.getPrisma().conversation.findUnique({
      where: { id: conversationId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

module.exports = router; 