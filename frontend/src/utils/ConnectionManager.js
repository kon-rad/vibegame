// Mock data for development
const MOCK_ENVIRONMENT_DATA = {
  characters: [
    {
      id: 1,
      name: 'Socrates',
      era: 'Ancient Greece, 470-399 BCE',
      bio: 'Athenian philosopher who is credited as the founder of Western philosophy.',
      avatar: '/assets/avatars/socrates.jpg',
      position: [-5, 0, 0],
      color: '#4287f5',
      primaryColor: '#8ca9ff',
      skinColor: '#e9c9a8',
      specialty: 'Dialectic method, ethics, epistemology',
      specialKeywords: ['knowledge', 'truth', 'wisdom', 'virtue', 'justice']
    },
    {
      id: 2,
      name: 'Leonardo da Vinci',
      era: 'Renaissance Italy, 1452-1519',
      bio: 'Italian polymath whose interests included invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography.',
      avatar: '/assets/avatars/davinci.jpg',
      position: [0, 0, 0],
      color: '#f54263',
      primaryColor: '#c74e36',
      skinColor: '#f0d0b0',
      specialty: 'Art, science, engineering, anatomy',
      specialKeywords: ['art', 'science', 'invention', 'painting', 'anatomy']
    },
    {
      id: 3,
      name: 'Marie Curie',
      era: 'Modern Poland/France, 1867-1934',
      bio: 'Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.',
      avatar: '/assets/avatars/curie.jpg',
      position: [5, 0, 0],
      color: '#42f59e',
      primaryColor: '#457b86',
      skinColor: '#e0b6a0',
      specialty: 'Physics, chemistry, radioactivity',
      specialKeywords: ['radioactivity', 'physics', 'chemistry', 'research', 'science']
    }
  ]
};

class ConnectionManager {
  constructor() {
    this.environmentData = MOCK_ENVIRONMENT_DATA;
    this.apiBaseUrl = '/api'; // This is correct, as it's relative to the frontend server
    this.useRealApi = true; // Set to false to use mock data instead of real API
    console.log('ConnectionManager initialized');
  }
  
  getEnvironmentData() {
    return this.environmentData;
  }
  
  getCharacters() {
    return this.environmentData?.characters || [];
  }
  
  async joinGameRoom() {
    console.log('Game room joined');
    return { id: 'mock-room' };
  }
  
  async sendMessage(characterId, message, userId = null, conversationId = null) {
    console.log(`Sending message to character ${characterId}: ${message}`);
    console.log(`User ID: ${userId}, Conversation ID: ${conversationId}`);
    
    if (!this.useRealApi) {
      // Use mock data for testing without API
      return this.generateMockResponse(characterId, message);
    }
    
    try {
      // Call the backend API - make sure we're using the correct endpoint
      const response = await fetch(`${this.apiBaseUrl}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: Number(characterId),
          message,
          userId: userId ? Number(userId) : null,
          conversationId: conversationId ? Number(conversationId) : null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      return { 
        success: true, 
        channel: 'api', 
        data: {
          character: data.character,
          message: data.message,
          timestamp: data.timestamp,
          conversationId: data.conversationId
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to mock response if API is not available
      if (this.useRealApi) {
        console.log('Falling back to mock response');
        return this.generateMockResponse(characterId, message);
      } else {
        return {
          success: false,
          error: error.message || 'Failed to send message'
        };
      }
    }
  }
  
  // Generate mock responses for testing
  generateMockResponse(characterId, message) {
    // Find the character
    const character = this.environmentData.characters.find(c => c.id === Number(characterId));
    
    if (!character) {
      return { success: false, error: 'Character not found' };
    }
    
    // Generate response based on character
    const response = this.generateResponse(character, message);
    
    return { 
      success: true, 
      channel: 'api', 
      data: {
        character: character.name,
        message: response,
        timestamp: new Date().toISOString(),
        conversationId: Math.floor(Math.random() * 1000) // Mock ID
      }
    };
  }
  
  generateResponse(character, message) {
    const lowerMessage = message.toLowerCase();
    
    // Get special keywords for this character
    const { specialKeywords = [] } = character;
    
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
        `If you wish to earn my token of wisdom, you must first demonstrate your ability to question even your most cherished beliefs.`,
        matchedKeywords.length > 0 ? `Ah, you speak of ${matchedKeywords[0]}. What is the essence of ${matchedKeywords[0]} in your view? Answer well, and I may share my token with you.` : null
      ],
      'Leonardo da Vinci': [
        `My studies in ${lowerMessage.includes('art') ? 'art and science' : 'nature and mathematics'} have shown me that everything connects in unexpected ways.`,
        `I've filled many notebooks contemplating such matters. ${lowerMessage.includes('paint') ? 'My paintings attempt to capture the essence beyond mere appearance.' : 'Observation is the key to understanding.'}`,
        `As I wrote in my journals, simplicity is the ultimate sophistication. Your question about "${message}" touches on this principle.`,
        `I've hidden my token of creativity in a puzzle of perspective. To earn it, you must show me you can see beyond the obvious.`,
        matchedKeywords.length > 0 ? `I've spent countless hours studying ${matchedKeywords[0]}. Help me unravel its mysteries, and my token shall be yours.` : null
      ],
      'Marie Curie': [
        `In my research on ${lowerMessage.includes('radium') ? 'radium' : 'radioactivity'}, I learned that one must persevere through many failures to find truth.`,
        `Nothing in life is to be feared, it is only to be understood. Now is the time to understand more about "${message}" so we may fear less.`,
        `Be less curious about people and more curious about ideas. Your question leads to fascinating scientific possibilities.`,
        `My token of discovery is not given lightly. Show me your dedication to scientific principles, and it may be yours.`,
        matchedKeywords.length > 0 ? `My work with ${matchedKeywords[0]} taught me that scientific progress comes from dedication and methodology. Help me with an experiment, and I'll share my token with you.` : null
      ]
    };
    
    // Get responses for this character or default to Socrates
    const characterResponses = responses[character.name] || responses['Socrates'];
    
    // Filter out null responses
    const validResponses = characterResponses.filter(resp => resp !== null);
    
    // Return a random response
    return validResponses[Math.floor(Math.random() * validResponses.length)];
  }
  
  async loadConversation(conversationId) {
    console.log(`Loading conversation: ${conversationId}`);
    
    if (!this.useRealApi) {
      console.log('Using mock data for conversation history');
      return this.generateMockConversationHistory(conversationId);
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/conversation/${conversationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const conversation = await response.json();
      console.log('Loaded conversation:', conversation);
      return conversation;
    } catch (error) {
      console.error('Error loading conversation:', error);
      
      if (this.useRealApi) {
        console.log('Falling back to mock conversation data');
        return this.generateMockConversationHistory(conversationId);
      }
      
      return null;
    }
  }
  
  // Generate mock conversation history for testing
  generateMockConversationHistory(conversationId) {
    const characterId = (conversationId % 3) + 1;
    const character = this.environmentData.characters.find(c => c.id === characterId);
    
    if (!character) return null;
    
    return {
      id: conversationId,
      title: `Conversation with ${character.name}`,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      character: character,
      messages: [
        {
          id: 1,
          text: "Hello, I'd like to learn about your work.",
          senderType: "user",
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          text: `I'm delighted to share my knowledge with you. What specific aspect of my work interests you?`,
          senderType: "character",
          createdAt: new Date(Date.now() - 3590000).toISOString()
        },
        {
          id: 3,
          text: "Tell me about your most important contribution.",
          senderType: "user",
          createdAt: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 4,
          text: this.generateResponse(character, "Tell me about your most important contribution."),
          senderType: "character",
          createdAt: new Date(Date.now() - 3490000).toISOString()
        }
      ]
    };
  }
  
  listenForMessages(callback) {
    console.log('Message listener registered');
    return () => console.log('Message listener removed');
  }
  
  disconnect() {
    console.log('Connection disconnected');
  }
}

export default ConnectionManager; 