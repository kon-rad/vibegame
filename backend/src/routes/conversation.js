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
    console.log(`Processing message to character ${characterId}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    
    // Find the character
    const character = await database.getCharacter(characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    let conversationHistory = [];
    
    // If continuing an existing conversation, fetch the history
    if (conversationId) {
      try {
        console.log(`Fetching history for conversation ${conversationId}`);
        conversationHistory = await database.getConversationMessages(conversationId);
        console.log(`Found ${conversationHistory.length} previous messages`);
      } catch (err) {
        console.warn(`Error fetching conversation history for ID ${conversationId}:`, err);
        // Continue with empty history if conversation not found
      }
    }
    
    // Generate a response using AIService
    console.log('Generating AI response...');
    const response = await aiService.generateResponse(characterId, message, conversationHistory);
    
    if (!response) {
      throw new Error('Failed to generate a response');
    }
    
    // Save to conversation history
    const title = conversationId ? null : `Conversation with ${character.name}`;
    const savedConversationId = await aiService.addConversationToHistory(
      userId, 
      characterId, 
      title, 
      message, 
      response
    );
    
    // Return the response to the client
    res.json({
      success: true,
      character: character.name,
      message: response,
      timestamp: new Date().toISOString(),
      conversationId: savedConversationId || conversationId
    });
  } catch (error) {
    console.error('Error processing conversation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process conversation',
      details: error.message
    });
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
    
    console.log(`Fetching conversations for user ${userId}`);
    
    const conversations = await database.getPrisma().conversation.findMany({
      where: { 
        userId,
        isArchived: false // Only return non-archived conversations
      },
      include: { 
        character: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get only the last message for preview
        }
      },
      orderBy: { updatedAt: 'desc' } // Most recent conversations first
    });
    
    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        characterId: conv.characterId,
        characterName: conv.character.name,
        characterAvatar: conv.character.avatar,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage: conv.messages.length > 0 ? {
          text: conv.messages[0].text.substring(0, 100),
          senderType: conv.messages[0].senderType,
          createdAt: conv.messages[0].createdAt
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch conversations',
      details: error.message 
    });
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
    
    console.log(`Fetching conversation ${conversationId}`);
    
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
    
    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        character: {
          id: conversation.character.id,
          name: conversation.character.name,
          era: conversation.character.era,
          bio: conversation.character.bio,
          avatar: conversation.character.avatar,
          specialty: conversation.character.specialty
        },
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          senderType: msg.senderType,
          createdAt: msg.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch conversation',
      details: error.message 
    });
  }
});

/**
 * PUT /api/conversation/:conversationId/archive
 * Archive a conversation
 */
router.put('/:conversationId/archive', async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    console.log(`Archiving conversation ${conversationId}`);
    
    const updatedConversation = await database.getPrisma().conversation.update({
      where: { id: conversationId },
      data: { isArchived: true }
    });
    
    res.json({
      success: true,
      message: 'Conversation archived successfully',
      conversationId: updatedConversation.id
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to archive conversation',
      details: error.message 
    });
  }
});

/**
 * PUT /api/conversation/:conversationId/title
 * Update conversation title
 */
router.put('/:conversationId/title', async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const { title } = req.body;
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Valid title is required' });
    }
    
    console.log(`Updating title for conversation ${conversationId}`);
    
    const updatedConversation = await database.getPrisma().conversation.update({
      where: { id: conversationId },
      data: { title }
    });
    
    res.json({
      success: true,
      message: 'Conversation title updated successfully',
      conversationId: updatedConversation.id,
      title: updatedConversation.title
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update conversation title',
      details: error.message 
    });
  }
});

module.exports = router; 