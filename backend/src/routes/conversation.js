const express = require('express');
const router = express.Router();
const environmentConfig = require('../config/environmentConfig');

/**
 * Simple character response generator
 * In a real implementation, this would use a more sophisticated AI model or API
 */
const generateCharacterResponse = (character, message) => {
  const lowerMessage = message.toLowerCase();
  
  // Get special keywords for this character
  const { specialKeywords = [], dialogueStyle = '' } = character;
  
  // Check if message contains any of the special keywords
  const matchedKeywords = specialKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Generate different responses based on the character
  const responses = {
    'Socrates': [
      `Indeed, that's a thought-provoking question. Have you considered that ${lowerMessage.includes('know') ? 'knowledge begins with acknowledging what we do not know' : 'wisdom comes from examining our assumptions'}?`,
      `I would ask you in return: what do you believe to be true about ${message}?`,
      `The unexamined life is not worth living, and your question about "${message}" is worthy of examination.`,
      matchedKeywords.length > 0 ? `Ah, you speak of ${matchedKeywords[0]}. What is the essence of ${matchedKeywords[0]} in your view?` : null
    ],
    'Leonardo da Vinci': [
      `My studies in ${lowerMessage.includes('art') ? 'art and science' : 'nature and mathematics'} have shown me that everything connects in unexpected ways.`,
      `I've filled many notebooks contemplating such matters. ${lowerMessage.includes('paint') ? 'My paintings attempt to capture the essence beyond mere appearance.' : 'Observation is the key to understanding.'}`,
      `As I wrote in my journals, simplicity is the ultimate sophistication. Your question about "${message}" touches on this principle.`,
      matchedKeywords.length > 0 ? `I've spent countless hours studying ${matchedKeywords[0]}. Did you know that ${matchedKeywords[0]} reveals the deeper patterns of nature?` : null
    ],
    'Marie Curie': [
      `In my research on ${lowerMessage.includes('radium') ? 'radium' : 'radioactivity'}, I learned that one must persevere through many failures to find truth.`,
      `Nothing in life is to be feared, it is only to be understood. Now is the time to understand more about "${message}" so we may fear less.`,
      `Be less curious about people and more curious about ideas. Your question leads to fascinating scientific possibilities.`,
      matchedKeywords.length > 0 ? `My work with ${matchedKeywords[0]} taught me that scientific progress comes from dedication and methodology, not from random chance.` : null
    ]
  };
  
  // Get responses for this character or default to Socrates
  const characterResponses = responses[character.name] || responses['Socrates'];
  
  // Filter out null responses
  const validResponses = characterResponses.filter(resp => resp !== null);
  
  // Return a random response
  return validResponses[Math.floor(Math.random() * validResponses.length)];
};

/**
 * POST /api/conversation
 * Handles a conversation message and returns a response
 */
router.post('/', (req, res) => {
  const { characterId, message } = req.body;
  
  if (!characterId || !message) {
    return res.status(400).json({ error: 'Character ID and message are required' });
  }
  
  // Find the character
  const character = environmentConfig.characters.find(c => c.id === characterId);
  
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }
  
  // Generate a response
  const response = generateCharacterResponse(character, message);
  
  // Return the response with some delay to simulate thinking
  setTimeout(() => {
    res.json({
      character: character.name,
      message: response,
      timestamp: new Date().toISOString()
    });
  }, 500);
});

module.exports = router; 