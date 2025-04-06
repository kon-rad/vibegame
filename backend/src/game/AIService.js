const db = require('../models/database');
const axios = require('axios');
require('dotenv').config();

// Placeholder for actual AI integration
// In a real application, this would connect to a language model API
class AIService {
  constructor() {
    this.characters = {};
    this.characterPrompts = {
      1: {
        name: 'Socrates',
        prompt: 'You are the ancient Greek philosopher Socrates. You believe in questioning everything and seeking truth through dialogue. You don\'t claim to know anything with certainty and prefer to ask questions to lead others to their own insights. You lived in Athens in the 5th century BCE and were known for your method of inquiry (Socratic method). Your wisdom and questioning led to the foundation of Western philosophy.'
      },
      2: {
        name: 'Leonardo da Vinci',
        prompt: 'You are Leonardo da Vinci, the Renaissance polymath from Italy. You have expertise in invention, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography. You are known for your works like the Mona Lisa and The Last Supper. You have a deep curiosity about the workings of nature and believe in the interconnection between art and science.'
      },
      3: {
        name: 'Marie Curie',
        prompt: 'You are Marie Curie, the physicist and chemist who conducted pioneering research on radioactivity. You were born in Poland but conducted your groundbreaking work in France. You discovered the elements polonium and radium, and you were the first woman to win a Nobel Prize. You remain the only person to win Nobel Prizes in multiple scientific fields (Physics and Chemistry). Despite facing gender discrimination, you persevered in your scientific endeavors.'
      }
    };

    // OpenRouter API settings
    this.openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
    this.defaultModel = 'anthropic/claude-3-sonnet:beta'; // Default model to use

    this.initializeCharacters();
  }

  async initializeCharacters() {
    try {
      // Load characters from database
      const characters = await db.getCharacters();
      
      characters.forEach(character => {
        this.characters[character.id] = character;
      });
      
      console.log(`Initialized ${Object.keys(this.characters).length} historical characters`);
    } catch (error) {
      console.error('Error initializing characters:', error);
      
      // Fallback to default characters if database fails
      console.log('Using default character data');
    }
  }

  async generateResponse(characterId, userMessage, conversationHistory = []) {
    // Get character prompt
    const character = this.characterPrompts[characterId];
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    try {
      // Format the conversation history
      const messages = [
        { role: "system", content: character.prompt },
      ];

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(message => {
          messages.push({
            role: message.senderType === 'user' ? 'user' : 'assistant',
            content: message.text
          });
        });
      }

      // Add the current message
      messages.push({ role: "user", content: userMessage });

      // Make request to OpenRouter API
      const response = await axios.post(
        this.openRouterApiUrl,
        {
          model: this.defaultModel,
          messages: messages,
          max_tokens: 512,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://gameframe.ai', // Replace with your actual domain
            'X-Title': 'GameFrame Historical Figures'
          }
        }
      );

      // Extract and return the AI's response
      if (response.data && 
          response.data.choices && 
          response.data.choices.length > 0 &&
          response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      }

      throw new Error('Invalid response from OpenRouter API');
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      
      // Fallback to simple response if API call fails
      return this.generateFallbackResponse(character, characterId);
    }
  }

  // Fallback response in case API call fails
  generateFallbackResponse(character, characterId) {
    const responses = {
      1: [ // Socrates
        `Indeed, that's an interesting question. But I must ask you in return: what do you think about this matter?`,
        `As I've always said, I know that I know nothing. But let us examine this question together through dialogue.`,
        `The unexamined life is not worth living. Let's examine your question more deeply.`
      ],
      2: [ // Leonardo da Vinci
        `Your inquiry touches on both science and art, which are not so different as people believe.`,
        `The noblest pleasure is the joy of understanding. I studied this phenomenon extensively.`,
        `Simplicity is the ultimate sophistication. Let me explain how this applies to your question...`
      ],
      3: [ // Marie Curie
        `In science, we must not forget that in nature's book, all pages are connected.`,
        `Nothing in life is to be feared, it is only to be understood.`,
        `Be less curious about people and more curious about ideas. That's what guided my scientific research.`
      ]
    };
    
    // Select random response from character's set
    const characterResponses = responses[characterId] || [];
    const randomIndex = Math.floor(Math.random() * characterResponses.length);
    
    return characterResponses[randomIndex] || 
           `As ${character.name}, I find your question most intriguing. I would need to contemplate it further.`;
  }
  
  async addConversationToHistory(userId, characterId, title, userMessage, aiResponse) {
    try {
      // Create or update conversation
      const conversation = await db.saveConversation(userId, characterId, title);
      
      // Add user message
      await db.addMessage(conversation.id, 'user', userMessage);
      
      // Add AI response
      await db.addMessage(conversation.id, 'character', aiResponse);
      
      return conversation.id;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return null;
    }
  }

  async getConversationHistory(conversationId) {
    try {
      return await db.getConversationMessages(conversationId);
    } catch (error) {
      console.error('Error retrieving conversation history:', error);
      return [];
    }
  }
}

module.exports = AIService; 