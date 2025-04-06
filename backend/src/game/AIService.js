const db = require('../models/database');
const axios = require('axios');
require('dotenv').config();

// Placeholder for actual AI integration
// In a real application, this would connect to a language model API
class AIService {
  constructor() {
    this.characters = {};
    
    // Default system prompts for fallback
    this.defaultPrompts = {
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
    this.defaultModel = process.env.AI_MODEL || 'anthropic/claude-3-sonnet:beta';

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

  // Get a character's system prompt (from DB or fallback)
  async getCharacterPrompt(characterId) {
    try {
      // Try to get from database first
      const character = await db.getCharacter(characterId);
      
      if (character && character.aiPrompt) {
        return character.aiPrompt;
      }
      
      // Fallback to default prompts
      if (this.defaultPrompts[characterId]) {
        return this.defaultPrompts[characterId].prompt;
      }
      
      throw new Error(`No prompt found for character ID ${characterId}`);
    } catch (error) {
      console.error(`Error getting prompt for character ${characterId}:`, error);
      
      // Last resort fallback
      return this.defaultPrompts[1].prompt; // Socrates as ultimate fallback
    }
  }

  // Extract character details for context
  async getCharacterDetails(characterId) {
    try {
      const character = await db.getCharacter(characterId);
      
      if (!character) {
        throw new Error(`Character with ID ${characterId} not found`);
      }
      
      // Return relevant details
      return {
        name: character.name,
        era: character.era,
        bio: character.bio,
        specialty: character.specialty || null
      };
    } catch (error) {
      console.error(`Error getting character details for ID ${characterId}:`, error);
      
      // Fallback to defaults
      return this.defaultPrompts[characterId] 
        ? { name: this.defaultPrompts[characterId].name }
        : { name: 'Historical Figure' };
    }
  }

  // Generate AI response using OpenRouter
  async generateResponse(characterId, userMessage, conversationHistory = []) {
    try {
      // Get character system prompt
      const systemPrompt = await this.getCharacterPrompt(characterId);
      
      // Get character details
      const characterDetails = await this.getCharacterDetails(characterId);
      
      // Format the conversation history
      const messages = [
        { role: "system", content: systemPrompt }
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

      // Add the current message with character context
      const contextualizedMessage = `${userMessage}`;
      messages.push({ role: "user", content: contextualizedMessage });

      console.log(`Sending request to OpenRouter API with model: ${this.defaultModel}`);
      console.log(`History length: ${conversationHistory.length} messages`);
      
      // Create the request payload
      const requestPayload = {
        model: this.defaultModel,
        messages: messages,
        max_tokens: 512,
        temperature: 0.7,
        // Enable private privacy settings to fix the data policy error
        transforms: ["middle-out"],
        route: "fallback",
        prompt_training: false,      // Disable prompt training
        response_training: false     // Disable response training
      };
      
      // For debugging (limit to prevent massive logs)
      const truncatedPayload = { ...requestPayload };
      if (truncatedPayload.messages && truncatedPayload.messages.length > 0) {
        truncatedPayload.messages = truncatedPayload.messages.map(msg => {
          if (msg.content && typeof msg.content === 'string' && msg.content.length > 200) {
            return { ...msg, content: msg.content.substring(0, 200) + '...' };
          }
          return msg;
        });
      }
      console.log(`Request payload: ${JSON.stringify(truncatedPayload, null, 2)}`);
      
      // Make request to OpenRouter API
      const response = await axios.post(
        this.openRouterApiUrl,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_DOMAIN || 'https://gameframe.ai',
            'X-Title': 'GameFrame Historical Figures',
            // Privacy headers for OpenRouter
            'OR-PROMPT-PRIVACY': 'private',
            'OR-RESPONSE-PRIVACY': 'private'
          }
        }
      );

      // Extract and return the AI's response
      if (response?.data?.choices?.[0]?.message?.content) {
        console.log('Received OpenRouter response:', {
          model: response.data.model || this.defaultModel,
          promptTokens: response.data.usage?.prompt_tokens,
          completionTokens: response.data.usage?.completion_tokens
        });
        
        return response.data.choices[0].message.content;
      } else {
        console.error('Unexpected response format:', JSON.stringify(response.data, null, 2).substring(0, 500));
        throw new Error('Invalid response format from OpenRouter API');
      }
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      
      // Check for OpenRouter specific errors
      if (error.response?.data?.error?.message) {
        console.error('OpenRouter error:', error.response.data.error.message);
        
        // Fallback to a different model if specific model not found
        if (error.response.status === 404) {
          console.log('Attempting fallback to another model: anthropic/claude-3-sonnet');
          
          try {
            // Clone the original payload but for the fallback
            const fallbackPayload = {
              model: 'anthropic/claude-3-sonnet',
              messages: messages || [],  // Use the messages from the outer scope
              max_tokens: 512,
              temperature: 0.7,
              // Enable private privacy settings
              prompt_training: false,
              response_training: false
            };
            
            const backupResponse = await axios.post(
              this.openRouterApiUrl,
              fallbackPayload,
              {
                headers: {
                  'Authorization': `Bearer ${this.openRouterApiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': process.env.APP_DOMAIN || 'https://gameframe.ai',
                  'X-Title': 'GameFrame Historical Figures',
                  'OR-PROMPT-PRIVACY': 'private',
                  'OR-RESPONSE-PRIVACY': 'private'
                }
              }
            );
            
            if (backupResponse?.data?.choices?.[0]?.message?.content) {
              console.log('Received fallback model response from anthropic/claude-3-sonnet');
              return backupResponse.data.choices[0].message.content;
            }
          } catch (backupError) {
            console.error('Fallback model also failed:', backupError.message);
          }
        }
      }
      
      if (error.response) {
        console.error('API response error status:', error.response.status);
        console.error('API response error data:', 
          typeof error.response.data === 'object' 
            ? JSON.stringify(error.response.data, null, 2).substring(0, 500) 
            : error.response.data
        );
      }
      
      // Fallback to simple response if API call fails
      return this.generateFallbackResponse(characterId);
    }
  }

  // Fallback response in case API call fails
  async generateFallbackResponse(characterId) {
    try {
      const character = await this.getCharacterDetails(characterId);
      const name = character.name;
      
      const responses = {
        'Socrates': [
          `Indeed, that's an interesting question. But I must ask you in return: what do you think about this matter?`,
          `As I've always said, I know that I know nothing. But let us examine this question together through dialogue.`,
          `The unexamined life is not worth living. Let's examine your question more deeply.`
        ],
        'Leonardo da Vinci': [
          `Your inquiry touches on both science and art, which are not so different as people believe.`,
          `The noblest pleasure is the joy of understanding. I studied this phenomenon extensively.`,
          `Simplicity is the ultimate sophistication. Let me explain how this applies to your question...`
        ],
        'Marie Curie': [
          `In science, we must not forget that in nature's book, all pages are connected.`,
          `Nothing in life is to be feared, it is only to be understood.`,
          `Be less curious about people and more curious about ideas. That's what guided my scientific research.`
        ]
      };
      
      // Select random response from character's set
      const characterResponses = responses[name] || [
        `As ${name}, I find your question most intriguing.`,
        `That's an excellent question. In my time, I pondered similar matters.`,
        `Let me share my perspective on this matter.`
      ];
      
      const randomIndex = Math.floor(Math.random() * characterResponses.length);
      return characterResponses[randomIndex];
    } catch (error) {
      console.error('Error generating fallback response:', error);
      return "I'm not sure how to respond to that. Perhaps we could discuss something else?";
    }
  }
  
  // Save conversation to database
  async addConversationToHistory(userId, characterId, title, userMessage, aiResponse) {
    try {
      // Create or update conversation
      const conversation = await db.saveConversation(userId, characterId, title);
      
      if (!conversation || !conversation.id) {
        throw new Error('Failed to create conversation record');
      }
      
      // Add user message
      await db.addMessage(conversation.id, 'user', userMessage);
      
      // Add AI response
      await db.addMessage(conversation.id, 'character', aiResponse);
      
      console.log(`Saved conversation ${conversation.id} to database`);
      return conversation.id;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return null;
    }
  }

  // Get conversation history
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