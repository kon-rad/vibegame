const { Room } = require('colyseus');
const { Schema, MapSchema, ArraySchema, type } = require('@colyseus/schema');
const AIService = require('./AIService');

// Define the schema for a player
class Player extends Schema {
  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.connectedTime = Date.now();
    this.activeCharacterId = null;
  }
}
type(Player, {
  id: 'string',
  name: 'string',
  connectedTime: 'number',
  activeCharacterId: 'number'
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
    this.messages = new ArraySchema();
  }
}
type(HistoryRoomState, {
  players: { map: Player },
  messages: [ ChatMessage ]
});

// Define the main room class
class HistoryRoom extends Room {
  async onCreate(options) {
    console.log('History room created with options:', options);
    
    // Initialize room state
    this.setState(new HistoryRoomState());
    
    // Initialize AI service
    this.aiService = new AIService();
    
    // Register message handlers
    this.onMessage('message', (client, data) => {
      this.handleChatMessage(client, data);
    });
    
    this.onMessage('selectCharacter', (client, data) => {
      this.handleCharacterSelection(client, data);
    });
    
    // Set maximum number of clients
    this.maxClients = options.maxClients || 20;
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
    welcomeMessage.text = `Welcome, ${player.name}! Select a historical character to start a conversation.`;
    welcomeMessage.isAIResponse = true;
    
    this.state.messages.push(welcomeMessage);
  }
  
  onLeave(client, consented) {
    console.log(`Client ${client.id} left history room`);
    
    // Remove player from room state
    delete this.state.players[client.id];
    
    // Notify other players
    const leaveMessage = new ChatMessage();
    leaveMessage.senderId = 'system';
    leaveMessage.text = `${this.state.players[client.id]?.name || 'A player'} has left the room.`;
    leaveMessage.isAIResponse = true;
    
    this.state.messages.push(leaveMessage);
  }
  
  onDispose() {
    console.log('History room disposed');
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
    selectionMessage.text = `You are now conversing with Character #${characterId}. Ask them something!`;
    selectionMessage.isAIResponse = true;
    
    this.state.messages.push(selectionMessage);
  }
}

module.exports = {
  HistoryRoom,
  HistoryRoomState,
  Player,
  ChatMessage
}; 