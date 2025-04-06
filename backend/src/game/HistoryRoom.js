const { Room } = require('colyseus');
const { Schema, MapSchema, ArraySchema, type } = require('@colyseus/schema');
const AIService = require('./AIService');
const AIAgentService = require('./AIAgentService');
const db = require('../models/database');
const { setAIAgentServiceRef } = require('../routes/conversation');

// Define the schema for a player
class Player extends Schema {
  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.connectedTime = Date.now();
    this.activeCharacterId = null;
    this.position = [0, 0, 5]; // Default position [x, y, z]
  }
}
type(Player, {
  id: 'string',
  name: 'string',
  connectedTime: 'number',
  activeCharacterId: 'number',
  position: ['number'] // Array of 3 numbers for [x, y, z]
});

// Define the schema for a character
class Character extends Schema {
  constructor(data = {}) {
    super();
    this.id = data.id || 0;
    this.name = data.name || '';
    this.position = data.position || [0, 0, 0];
    this.isMoving = false;
    this.isInteracting = false;
    this.targetPosition = [0, 0, 0];
  }
}
type(Character, {
  id: 'number',
  name: 'string',
  position: ['number'],
  isMoving: 'boolean',
  isInteracting: 'boolean',
  targetPosition: ['number']
});

// Define the schema for a message
class ChatMessage extends Schema {
  constructor() {
    super();
    this.senderId = '';
    this.characterId = null;
    this.text = '';
    this.timestamp = Date.now();
    this.isAIResponse = false;
  }
}
type(ChatMessage, {
  senderId: 'string',
  characterId: 'number',
  text: 'string',
  timestamp: 'number',
  isAIResponse: 'boolean'
});

// Define the schema for the room state
class HistoryRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.characters = new MapSchema();
    this.messages = new ArraySchema();
  }
}
type(HistoryRoomState, {
  players: { map: Player },
  characters: { map: Character },
  messages: [ ChatMessage ]
});

// Define the main room class
class HistoryRoom extends Room {
  async onCreate(options) {
    console.log('History room created with options:', options);
    
    // Initialize room state
    this.setState(new HistoryRoomState());
    
    // Initialize AI services
    this.aiService = new AIService();
    this.aiAgentService = new AIAgentService();
    
    // Share the AIAgentService instance with the conversation router
    setAIAgentServiceRef(this.aiAgentService);
    
    // Load characters from database
    await this.loadCharacters();
    
    // Register message handlers
    this.onMessage('message', (client, data) => {
      this.handleChatMessage(client, data);
    });
    
    this.onMessage('selectCharacter', (client, data) => {
      this.handleCharacterSelection(client, data);
    });
    
    this.onMessage('playerMove', (client, data) => {
      this.handlePlayerMove(client, data);
    });
    
    // Add a message handler to force characters to wander (for testing)
    this.onMessage('forceWander', (client, data) => {
      console.log(`Client ${client.id} requested forced wander`);
      this.aiAgentService.forceWanderAll();
      
      // Send confirmation message
      const confirmationMessage = new ChatMessage();
      confirmationMessage.senderId = 'system';
      confirmationMessage.text = `Characters are now wandering around.`;
      confirmationMessage.isAIResponse = true;
      this.state.messages.push(confirmationMessage);
    });
    
    // Set maximum number of clients
    this.maxClients = options.maxClients || 20;
    
    // Set game update interval (60 times per second)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }
  
  async loadCharacters() {
    try {
      // Load characters from database
      const characters = await db.getCharacters();
      
      // Add characters to room state
      characters.forEach(characterData => {
        const character = new Character(characterData);
        this.state.characters[character.id] = character;
      });
      
      // Initialize AI agents for each character
      for (const characterId in this.state.characters) {
        const character = this.state.characters[characterId];
        await this.aiAgentService.initializeAgent(character, this.state);
      }
      
      // Start the AI agents
      await this.aiAgentService.startAgents();
      
      console.log(`Loaded ${Object.keys(this.state.characters).length} characters`);
    } catch (error) {
      console.error('Error loading characters:', error);
      
      // Fallback to default characters if database fails
      this.loadDefaultCharacters();
    }
  }
  
  loadDefaultCharacters() {
    // Fallback character data
    const defaultCharacters = [
      {
        id: 1,
        name: 'Socrates',
        position: [-5, 0, 0]
      },
      {
        id: 2,
        name: 'Leonardo da Vinci',
        position: [0, 0, 0]
      },
      {
        id: 3,
        name: 'Marie Curie',
        position: [5, 0, 0]
      }
    ];
    
    // Add characters to room state
    defaultCharacters.forEach(characterData => {
      const character = new Character(characterData);
      this.state.characters[character.id] = character;
    });
    
    console.log('Using default character data');
  }
  
  onJoin(client, options) {
    console.log(`Client ${client.id} joined history room`);
    
    // Create player instance
    const player = new Player();
    player.id = client.id;
    player.name = options.name || `Player ${client.id.substr(0, 4)}`;
    
    // Add player to room state
    this.state.players[client.id] = player;
    
    // Send welcome message
    const welcomeMessage = new ChatMessage();
    welcomeMessage.senderId = 'system';
    welcomeMessage.text = `Welcome, ${player.name}! Select a historical character to start a conversation. Use WASD to move around and approach characters.`;
    welcomeMessage.isAIResponse = true;
    
    this.state.messages.push(welcomeMessage);
  }
  
  onLeave(client, consented) {
    console.log(`Client ${client.id} left history room`);
    
    // Get player name before removing from state
    const playerName = this.state.players[client.id]?.name || 'A player';
    
    // Remove player from room state
    delete this.state.players[client.id];
    
    // Notify other players
    const leaveMessage = new ChatMessage();
    leaveMessage.senderId = 'system';
    leaveMessage.text = `${playerName} has left the room.`;
    leaveMessage.isAIResponse = true;
    
    this.state.messages.push(leaveMessage);
  }
  
  onDispose() {
    console.log('History room disposed');
    
    // Clean up AI agents
    this.aiAgentService.stopAgents();
    
    // Clear all intervals
    this.clock.clear();
  }
  
  // Game loop update
  update(deltaTime) {
    // Update AI character positions and interactions
    this.aiAgentService.update(deltaTime);
    
    // Sync character states from AI agent service to room state
    for (const characterId in this.state.characters) {
      const character = this.state.characters[characterId];
      const agentState = this.aiAgentService.getCharacterState(characterId);
      
      if (agentState) {
        // Update character position in room state
        character.position = agentState.position;
        character.isMoving = agentState.isMoving;
        character.isInteracting = agentState.isInteracting;
        
        // Handle AI-initiated conversations
        if (agentState.isInteracting && 
            agentState.currentInteraction?.type === 'conversation' && 
            !agentState.currentInteraction.handled) {
          
          // Mark as handled to prevent duplicate messages
          agentState.currentInteraction.handled = true;
          
          // Generate AI greeting message
          this.handleAIInitiatedConversation(
            character.id, 
            agentState.currentInteraction.targetId,
            agentState.currentInteraction.greeting
          );
        }
      }
    }
  }
  
  // Handle player moving in the world
  handlePlayerMove(client, data) {
    const player = this.state.players[client.id];
    if (!player) return;
    
    // Update player position
    if (data && Array.isArray(data.position) && data.position.length === 3) {
      player.position = data.position;
    }
  }
  
  // Handle AI character initiating a conversation with a player
  async handleAIInitiatedConversation(characterId, playerId, greeting) {
    // If no greeting was provided, generate one
    if (!greeting) {
      const character = this.state.characters[characterId];
      greeting = `Hello there! I am ${character.name}. Would you like to learn about my life and accomplishments?`;
    }
    
    // Create AI greeting message
    const greetingMessage = new ChatMessage();
    greetingMessage.senderId = 'ai';
    greetingMessage.characterId = Number(characterId);
    greetingMessage.text = greeting;
    greetingMessage.isAIResponse = true;
    
    // Add message to history
    this.state.messages.push(greetingMessage);
    
    // Auto-select this character for the player if they don't have a character selected
    const player = this.state.players[playerId];
    if (player && !player.activeCharacterId) {
      player.activeCharacterId = Number(characterId);
      
      // Notify the player of auto-selection
      const selectionMessage = new ChatMessage();
      selectionMessage.senderId = 'system';
      selectionMessage.characterId = Number(characterId);
      selectionMessage.text = `${this.state.characters[characterId].name} has approached you and started a conversation.`;
      selectionMessage.isAIResponse = true;
      
      this.state.messages.push(selectionMessage);
    }
  }
  
  // Handle player sending a chat message
  async handleChatMessage(client, data) {
    const player = this.state.players[client.id];
    
    if (!player) {
      console.error(`Received message from unknown client: ${client.id}`);
      return;
    }
    
    if (!player.activeCharacterId) {
      console.error(`Player ${player.name} tried to send message without selecting a character`);
      return;
    }
    
    // Create user message
    const userMessage = new ChatMessage();
    userMessage.senderId = client.id;
    userMessage.characterId = player.activeCharacterId;
    userMessage.text = data.message;
    
    // Add message to history
    this.state.messages.push(userMessage);
    
    // Generate AI response
    try {
      const aiResponse = await this.aiService.generateResponse(player.activeCharacterId, data.message);
      
      // Create AI response message
      const responseMessage = new ChatMessage();
      responseMessage.senderId = 'ai';
      responseMessage.characterId = player.activeCharacterId;
      responseMessage.text = aiResponse;
      responseMessage.isAIResponse = true;
      
      // Add AI response to history
      this.state.messages.push(responseMessage);
      
      // Save conversation to database if user ID is provided
      if (data.userId) {
        await this.aiService.addConversationToHistory(
          data.userId,
          player.activeCharacterId,
          data.conversationTitle || null,
          data.message,
          aiResponse
        );
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Create error message
      const errorMessage = new ChatMessage();
      errorMessage.senderId = 'system';
      errorMessage.characterId = player.activeCharacterId;
      errorMessage.text = 'The historical character is thinking deeply... Please try again.';
      errorMessage.isAIResponse = true;
      
      // Add error message to history
      this.state.messages.push(errorMessage);
    }
  }
  
  // Handle player selecting a character
  handleCharacterSelection(client, data) {
    const player = this.state.players[client.id];
    
    if (!player) {
      console.error(`Received selection from unknown client: ${client.id}`);
      return;
    }
    
    const characterId = data.characterId;
    
    // Update player's active character
    player.activeCharacterId = characterId;
    
    console.log(`Player ${player.name} selected character ${characterId}`);
    
    // Notify the player
    const selectionMessage = new ChatMessage();
    selectionMessage.senderId = 'system';
    selectionMessage.characterId = characterId;
    selectionMessage.text = `You are now conversing with ${this.state.characters[characterId].name}. Ask them something!`;
    selectionMessage.isAIResponse = true;
    
    this.state.messages.push(selectionMessage);
  }
}

module.exports = {
  HistoryRoom,
  HistoryRoomState,
  Player,
  Character,
  ChatMessage
}; 