const { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } = require('@virtuals-protocol/game');
const db = require('../models/database');
require('dotenv').config();

class AIAgentService {
  constructor() {
    this.workers = {};
    this.roomState = null;
    
    // Track the positions and states of characters
    this.characterStates = {};
    
    // Distance threshold for initiating conversations
    this.interactionDistance = 3.0;
    
    // Decision interval (milliseconds)
    this.decisionInterval = 5000; // Reduced to 5 seconds for faster testing
    
    // Store intervals for cleanup
    this.intervals = {};
    
    console.log('[AIAgentService] Initialized');
  }

  /**
   * Initialize an AI worker for a specific character
   * @param {object} character - The character data
   * @param {object} roomState - The Colyseus room state for position updates
   */
  async initializeAgent(character, roomState) {
    try {
      console.log(`[AIAgentService] Initializing agent for ${character.name} (ID: ${character.id})`);
      this.roomState = roomState;
      
      // Set up initial character state
      this.characterStates[character.id] = {
        id: character.id,
        name: character.name,
        position: character.position || [0, 0, 0],
        targetPosition: null,
        isMoving: false,
        isInteracting: false,
        lastInteractionTime: 0,
        currentInteraction: null
      };
      
      console.log(`[AIAgentService] Character ${character.name} initial position: [${character.position}]`);
      
      // Define the functions the character can perform
      const moveTo = new GameFunction({
        name: "move_to_position",
        description: "Move to a specific position in the 3D world",
        args: [
          { name: "x", type: "number", description: "X coordinate" },
          { name: "y", type: "number", description: "Y coordinate" },
          { name: "z", type: "number", description: "Z coordinate" }
        ] ,
        executable: async (args, logger) => {
          try {
            logger(`${character.name} is moving to position [${args.x}, ${args.y}, ${args.z}]`);
            console.log(`[AIAgentService] ${character.name} moving to [${args.x}, ${args.y}, ${args.z}]`);
            
            // Update character state with target position
            this.characterStates[character.id].targetPosition = [args.x, args.y, args.z];
            this.characterStates[character.id].isMoving = true;
            
            // The actual movement is handled by the update method
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              `Started moving to position [${args.x}, ${args.y}, ${args.z}]`
            );
          } catch (e) {
            logger(`Failed to move to position: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to move: ${e.message}`
            );
          }
        }
      });
      
      const approachPlayer = new GameFunction({
        name: "approach_player",
        description: "Approach a specific player in the 3D world",
        args: [
          { name: "playerId", type: "string", description: "The ID of the player to approach" }
        ],
        executable: async (args, logger) => {
          try {
            // Get player position from room state
            const player = this.roomState.players[args.playerId];
            
            if (!player) {
              console.log(`[AIAgentService] Player ${args.playerId} not found in room state`);
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Player ${args.playerId} not found`
              );
            }
            
            // Extract player position and add some distance to avoid getting too close
            const playerPos = player.position || [0, 0, 0];
            console.log(`[AIAgentService] Player ${args.playerId} is at position [${playerPos}]`);
            
            // Calculate position near the player (1 unit away)
            const direction = this.calculateApproachDirection(
              this.characterStates[character.id].position,
              playerPos
            );
            
            const targetX = playerPos[0] - direction[0] * 1.5;
            const targetZ = playerPos[2] - direction[2] * 1.5;
            
            logger(`${character.name} is approaching player ${args.playerId} at [${targetX}, 0, ${targetZ}]`);
            console.log(`[AIAgentService] ${character.name} approaching player ${args.playerId} at [${targetX}, 0, ${targetZ}]`);
            
            // Update character state
            this.characterStates[character.id].targetPosition = [targetX, 0, targetZ];
            this.characterStates[character.id].isMoving = true;
            this.characterStates[character.id].currentInteraction = {
              type: 'approach',
              targetId: args.playerId
            };
            
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              `Started approaching player ${args.playerId}`
            );
          } catch (e) {
            logger(`Failed to approach player: ${e.message}`);
            console.error(`[AIAgentService] Error approaching player:`, e);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to approach player: ${e.message}`
            );
          }
        }
      });
      
      const initiateConversation = new GameFunction({
        name: "initiate_conversation",
        description: "Start a conversation with a nearby player",
        args: [
          { name: "playerId", type: "string", description: "The ID of the player to talk to" },
          { name: "greeting", type: "string", description: "The greeting message to send" }
        ],
        executable: async (args, logger) => {
          try {
            // Check if player exists and is nearby
            const player = this.roomState.players[args.playerId];
            
            if (!player) {
              console.log(`[AIAgentService] Player ${args.playerId} not found for conversation`);
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Player ${args.playerId} not found`
              );
            }
            
            // Check distance to player
            const playerPos = player.position || [0, 0, 0];
            const charPos = this.characterStates[character.id].position;
            const distance = this.calculateDistance(charPos, playerPos);
            
            console.log(`[AIAgentService] Distance to player ${args.playerId}: ${distance.toFixed(2)} units`);
            
            if (distance > this.interactionDistance) {
              logger(`Player ${args.playerId} is too far (${distance.toFixed(2)} units). Moving closer first.`);
              
              // Try to approach the player first
              this.characterStates[character.id].targetPosition = playerPos;
              this.characterStates[character.id].isMoving = true;
              
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Player is too far away (${distance.toFixed(2)} units). Moving closer first.`
              );
            }
            
            logger(`${character.name} is initiating conversation with player ${args.playerId}`);
            console.log(`[AIAgentService] ${character.name} initiating conversation with player ${args.playerId}`);
            
            // Set character as interacting
            this.characterStates[character.id].isInteracting = true;
            this.characterStates[character.id].lastInteractionTime = Date.now();
            this.characterStates[character.id].currentInteraction = {
              type: 'conversation',
              targetId: args.playerId,
              greeting: args.greeting
            };
            
            // The actual conversation is handled by the HistoryRoom
            // We'll emit an event to be handled there
            
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              `Started conversation with player ${args.playerId}`
            );
          } catch (e) {
            logger(`Failed to initiate conversation: ${e.message}`);
            console.error(`[AIAgentService] Error initiating conversation:`, e);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to initiate conversation: ${e.message}`
            );
          }
        }
      });
      
      // Create a worker for this character
      const worker = new GameWorker({
        id: `character_${character.id}`,
        name: character.name,
        description: `${character.name} (${character.era}) - ${character.bio}`,
        functions: [moveTo, approachPlayer, initiateConversation],
        getEnvironment: async () => {
          // Get the current environment state
          return {
            position: this.characterStates[character.id].position,
            isMoving: this.characterStates[character.id].isMoving,
            isInteracting: this.characterStates[character.id].isInteracting,
            nearbyPlayers: this.getNearbyPlayers(character.id),
            specialty: character.specialty,
            era: character.era
          };
        }
      });
      
      // Store the worker
      this.workers[character.id] = worker;
      
      console.log(`[AIAgentService] AI worker initialized for ${character.name}`);
      
      return true;
    } catch (error) {
      console.error(`[AIAgentService] Error initializing worker for ${character?.name || 'unknown character'}:`, error);
      return false;
    }
  }
  
  /**
   * Start all initialized AI workers to make decisions periodically
   */
  async startAgents() {
    console.log(`[AIAgentService] Starting ${Object.keys(this.workers).length} agent decision loops`);
    
    for (const characterId in this.workers) {
      // Start the agent decision loop
      this.startDecisionLoop(characterId);
      console.log(`[AIAgentService] Agent decision loop started for character ${characterId}`);
    }
    
    // Force an initial wander for each character
    setTimeout(() => {
      this.forceWanderAll();
    }, 2000);
  }
  
  /**
   * Start the decision loop for a character
   */
  startDecisionLoop(characterId) {
    // Clear any existing interval for this character
    if (this.intervals[characterId]) {
      clearInterval(this.intervals[characterId]);
    }
    
    // Create a new decision interval
    this.intervals[characterId] = setInterval(() => {
      this.makeDecision(characterId);
    }, this.decisionInterval);
  }
  
  /**
   * Make a decision for a character
   */
  async makeDecision(characterId) {
    try {
      const charState = this.characterStates[characterId];
      const worker = this.workers[characterId];
      
      // Skip if character is already interacting or moving
      if (charState.isInteracting || charState.isMoving) {
        console.log(`[AIAgentService] Character ${characterId} is busy (interacting: ${charState.isInteracting}, moving: ${charState.isMoving})`);
        return;
      }
      
      // Get nearby players
      const nearbyPlayers = this.getNearbyPlayers(characterId);
      console.log(`[AIAgentService] Character ${characterId} detected ${nearbyPlayers.length} nearby players`);
      
      // Simple decision making logic:
      // 1. If there are players nearby, approach the closest one
      // 2. If no players nearby, wander to a random position
      
      if (nearbyPlayers.length > 0) {
        const closestPlayer = nearbyPlayers[0];
        
        console.log(`[AIAgentService] Character ${characterId} (${charState.name}) detected player ${closestPlayer.id} at distance ${closestPlayer.distance.toFixed(2)}`);
        
        // If player is very close, initiate conversation
        if (closestPlayer.distance < this.interactionDistance) {
          // Create a character-specific greeting
          const greeting = this.generateGreeting(characterId);
          
          await worker.functions.find(f => f.name === "initiate_conversation").executable({
            playerId: closestPlayer.id,
            greeting
          }, (msg) => console.log(`[Character ${characterId}] ${msg}`));
        } 
        // Otherwise, approach the player
        else {
          await worker.functions.find(f => f.name === "approach_player").executable({
            playerId: closestPlayer.id
          }, (msg) => console.log(`[Character ${characterId}] ${msg}`));
        }
      } 
      // No players nearby, wander randomly
      else if (Math.random() < 0.5) { // Increased to 50% chance to wander for testing
        // Generate a random position within reasonable bounds
        const randomX = charState.position[0] + (Math.random() * 10 - 5);
        const randomZ = charState.position[2] + (Math.random() * 10 - 5);
        
        console.log(`[AIAgentService] Character ${characterId} (${charState.name}) wandering to [${randomX.toFixed(2)}, 0, ${randomZ.toFixed(2)}]`);
        
        await worker.functions.find(f => f.name === "move_to_position").executable({
          x: randomX,
          y: 0,
          z: randomZ
        }, (msg) => console.log(`[Character ${characterId}] ${msg}`));
      }
    } catch (error) {
      console.error(`[AIAgentService] Error making decision for character ${characterId}:`, error);
    }
  }
  
  /**
   * Force all characters to wander to random positions (useful for testing)
   */
  forceWanderAll() {
    console.log(`[AIAgentService] Forcing all characters to wander`);
    
    for (const characterId in this.workers) {
      this.forceWander(characterId);
    }
  }
  
  /**
   * Force a character to wander to a random position
   */
  async forceWander(characterId) {
    try {
      const charState = this.characterStates[characterId];
      const worker = this.workers[characterId];
      
      if (!charState || !worker) {
        console.log(`[AIAgentService] Character ${characterId} not found`);
        return;
      }
      
      // Skip if already in conversation
      if (charState.isInteracting) {
        console.log(`[AIAgentService] Character ${characterId} is interacting, skipping forced wander`);
        return;
      }
      
      // Generate a random position within reasonable bounds
      const randomX = charState.position[0] + (Math.random() * 10 - 5);
      const randomZ = charState.position[2] + (Math.random() * 10 - 5);
      
      console.log(`[AIAgentService] Forcing character ${characterId} (${charState.name}) to wander to [${randomX.toFixed(2)}, 0, ${randomZ.toFixed(2)}]`);
      
      await worker.functions.find(f => f.name === "move_to_position").executable({
        x: randomX,
        y: 0,
        z: randomZ
      }, (msg) => console.log(`[Character ${characterId}] ${msg}`));
      
      return true;
    } catch (error) {
      console.error(`[AIAgentService] Error forcing wander for character ${characterId}:`, error);
      return false;
    }
  }
  
  /**
   * Generate a greeting for a character
   */
  generateGreeting(characterId) {
    const charState = this.characterStates[characterId];
    
    // Character-specific greetings
    const greetings = {
      // Socrates
      '1': [
        "Greetings, seeker of wisdom! I am Socrates. What question troubles your mind today?",
        "Ah, a new face! I am Socrates. Remember, the unexamined life is not worth living. Shall we examine yours?",
        "Hello there! I am Socrates. I know that I know nothing, but perhaps together we can find some truth?"
      ],
      // Leonardo da Vinci
      '2': [
        "Buongiorno! I am Leonardo da Vinci. Might you be interested in discussing art, science, or perhaps engineering?",
        "Greetings! Leonardo da Vinci at your service. What curiosities of nature or human invention shall we explore?",
        "Welcome, curious mind! I am Leonardo. The noblest pleasure is the joy of understanding. Shall we seek it together?"
      ],
      // Marie Curie
      '3': [
        "Hello! I am Marie Curie. Would you like to discuss the wonders of radioactivity or perhaps the challenges of scientific discovery?",
        "Greetings! I am Marie Curie. In science, we must not forget that in nature's book, all pages are connected. Shall we explore some of those connections?",
        "Bonjour! Marie Curie here. Nothing in life is to be feared, it is only to be understood. What would you like to understand today?"
      ]
    };
    
    // Default greeting if character-specific ones aren't available
    const defaultGreetings = [
      `Hello there! I am ${charState.name}. Would you like to learn about my life and accomplishments?`,
      `Greetings! I am ${charState.name}. I've been eager to share my knowledge with someone like you.`,
      `Welcome! I am ${charState.name}. It would be my pleasure to tell you about my era and contributions.`
    ];
    
    // Get the appropriate greeting list
    const greetingList = greetings[characterId] || defaultGreetings;
    
    // Return a random greeting from the list
    return greetingList[Math.floor(Math.random() * greetingList.length)];
  }
  
  /**
   * Update the positions of all characters
   * This should be called frequently from the game loop
   */
  update(deltaTime) {
    for (const characterId in this.characterStates) {
      const charState = this.characterStates[characterId];
      
      // If character has a target position and is moving
      if (charState.isMoving && charState.targetPosition) {
        const currentPos = charState.position;
        const targetPos = charState.targetPosition;
        
        // Calculate direction vector
        const dx = targetPos[0] - currentPos[0];
        const dz = targetPos[2] - currentPos[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If we're close enough to target, stop moving
        if (distance < 0.1) {
          charState.isMoving = false;
          charState.position = targetPos;
          
          console.log(`[AIAgentService] Character ${characterId} reached target position [${targetPos}]`);
          
          // If this was an approach interaction, initiate conversation
          if (charState.currentInteraction?.type === 'approach') {
            charState.isInteracting = true;
            charState.lastInteractionTime = Date.now();
            console.log(`[AIAgentService] Character ${characterId} starting interaction after approach`);
          }
          
          continue;
        }
        
        // Calculate movement based on speed and delta time
        const moveSpeed = 0.1; // units per update
        const moveDistance = Math.min(distance, moveSpeed * deltaTime);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirZ = dz / distance;
        
        // Update position
        const newPosition = [
          currentPos[0] + dirX * moveDistance,
          currentPos[1], // Keep same Y
          currentPos[2] + dirZ * moveDistance
        ];
        
        charState.position = newPosition;
        
        // Update roomState for synchronization (only x and z change)
        if (this.roomState && this.roomState.characters && this.roomState.characters[characterId]) {
          this.roomState.characters[characterId].position = newPosition;
          // Log position update occasionally (not every frame to avoid spam)
          if (Math.random() < 0.02) {
            console.log(`[AIAgentService] Character ${characterId} position updated to [${newPosition}]`);
          }
        } else {
          console.log(`[AIAgentService] Warning: Can't update character position in room state`);
        }
      }
    }
  }
  
  /**
   * Get nearby players for a character
   */
  getNearbyPlayers(characterId) {
    const charState = this.characterStates[characterId];
    if (!charState || !this.roomState) return [];
    
    const nearbyPlayers = [];
    
    // Check all players in the room
    for (const playerId in this.roomState.players) {
      const player = this.roomState.players[playerId];
      
      if (player) {
        const playerPos = player.position || [0, 0, 0];
        const distance = this.calculateDistance(charState.position, playerPos);
        
        // Add nearby players with their distance
        if (distance < 10) { // 10 units of detection range
          nearbyPlayers.push({
            id: playerId,
            name: player.name,
            position: playerPos,
            distance
          });
        }
      }
    }
    
    // Sort by distance
    return nearbyPlayers.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * Get the current state of a character
   */
  getCharacterState(characterId) {
    return this.characterStates[characterId] || null;
  }
  
  /**
   * Helper for calculating distance between positions
   */
  calculateDistance(pos1, pos2) {
    const dx = pos2[0] - pos1[0];
    const dz = pos2[2] - pos1[2];
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * Calculate a normalized direction vector from pos1 to pos2
   */
  calculateApproachDirection(pos1, pos2) {
    const dx = pos2[0] - pos1[0];
    const dz = pos2[2] - pos1[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.001) return [0, 0, 1]; // Default direction if too close
    
    return [dx / distance, 0, dz / distance];
  }
  
  /**
   * Stop all agent decision loops and clean up
   */
  stopAgents() {
    console.log(`[AIAgentService] Stopping all agent decision loops`);
    // Clear all intervals
    for (const characterId in this.intervals) {
      clearInterval(this.intervals[characterId]);
    }
    
    this.intervals = {};
    this.workers = {};
    this.characterStates = {};
  }
}

module.exports = AIAgentService; 