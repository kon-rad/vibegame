# Backend Architecture Overview

## Introduction

This document provides a comprehensive overview of the backend architecture for the 3D AI Game application. It serves as a guide for new developers joining the project and as a reference for standardizing development practices, including those used by AI assistants.

## Tech Stack

### Core Technologies

- **Framework**: Node.js with Express (v4.17.3)
- **Database**: SQLite with Prisma ORM (v4.8.0)
- **Real-time Communication**:
  - Socket.IO (v4.7.4) - For general-purpose WebSocket communication 
  - Colyseus (v0.14.13) - For game state synchronization
- **AI Integration**: Custom AIService implementation

## Project Structure

```
backend/
├── data/                  # Stores SQLite database file(s)
├── node_modules/          # Node.js dependencies
├── prisma/                # Prisma ORM configuration and migrations
│   ├── migrations/        # Database migration files
│   ├── schema.prisma      # Database schema definition
│   └── seed.js            # Seed script for initial data
├── public/                # Static assets served by the backend
│   └── avatars/           # Character avatar images
├── src/                   # Source code
│   ├── config/            # Configuration files
│   │   └── environmentConfig.js  # 3D environment configuration
│   ├── game/              # Game logic components
│   │   ├── AIService.js   # AI conversation service
│   │   └── HistoryRoom.js # Colyseus room implementation
│   ├── models/            # Database models and data access
│   │   └── database.js    # Database access layer
│   ├── routes/            # API route definitions
│   │   ├── conversation.js # Conversation endpoints
│   │   └── environment.js  # 3D environment endpoints
│   ├── server/            # Server setup and configuration
│   │   └── index.js       # Alternative server entry point
│   └── index.js           # Main application entry point
├── .env                   # Environment variables
├── .env.example           # Example environment variables
└── package.json           # Project dependencies and scripts
```

## Core Components

### 1. Express Server (src/index.js)

The main entry point of the application that:
- Configures Express middleware
- Sets up API routes
- Initializes Socket.IO for WebSocket communication
- Integrates with Colyseus for game state synchronization
- Serves static assets

### 2. Database Layer (src/models/database.js)

A unified interface for interacting with the database that:
- Initializes the Prisma client
- Provides methods for accessing and manipulating data
- Handles database connections and disconnections
- Seeds initial data (historical characters)

### 3. AI Service (src/game/AIService.js)

The AI service responsible for:
- Processing user messages
- Generating character responses 
- Maintaining conversation context
- Saving conversations to the database

### 4. Colyseus Game Rooms (src/game/HistoryRoom.js)

Real-time multiplayer functionality through:
- Room state management with schema-based data structures
- Handling player connections and disconnections
- Synchronizing game state across clients
- Processing message exchanges between users and historical characters

### 5. API Routes

#### Conversation Routes (src/routes/conversation.js)

Endpoints for managing conversations:
- `POST /api/conversation`: Process a user message and get an AI response
- `GET /api/conversation/user/:userId`: Fetch a user's conversation history
- `GET /api/conversation/:conversationId`: Fetch a specific conversation
- `PUT /api/conversation/:conversationId/archive`: Archive a conversation
- `PUT /api/conversation/:conversationId/title`: Update a conversation title

#### Environment Routes (src/routes/environment.js)

Endpoints for 3D environment data:
- `GET /api/environment`: Get the complete environment configuration
- `GET /api/environment/scene`: Get scene configuration
- `GET /api/environment/trees`: Get tree configuration
- `GET /api/environment/characters`: Get all character configurations
- `GET /api/environment/characters/:id`: Get a specific character

## Database Schema (Prisma)

The database schema includes these main models:

### Character

Represents historical figures available for conversation:
- Basic information (name, era, biography, avatar)
- Visual properties (position, colors)
- Conversation properties (specialty, dialogue style, special keywords)
- Relationships to conversations

### User

Represents application users:
- Basic profile (username, email, avatar)
- Activity tracking (last active)
- Token balance and settings
- Relationships to conversations

### Conversation

Represents a dialogue session:
- Title and timestamps
- Relations to characters and users
- Archive status
- Associated messages

### Message

Represents individual messages within conversations:
- Text content
- Sender information
- Timestamps
- Metadata (sentiment, tokens, etc.)

### Additional Models

Additional models support features like chat rooms and token tracking:
- `ChatRoom`: For multi-user, multi-character discussions
- `RoomMember`: For user participation in chat rooms
- `RoomMessage`: For messages in chat rooms
- `TokenGrant`: For tracking token economy

## Communication Architecture

The backend implements a dual communication architecture:

### HTTP REST API

Used for:
- CRUD operations on resources (conversations, characters)
- Initial data loading
- Non-real-time operations

### WebSocket Communication

Two separate WebSocket systems are used:

#### 1. Socket.IO

Used for:
- General purpose real-time communication
- Fallback for environments without WebSocket support
- Simple event-based messaging

#### 2. Colyseus

Used for:
- Game state synchronization
- Room-based multiplayer
- Schema-based data structures
- Efficient state delta transmission

## Standard Patterns

### 1. Controller-Service Pattern

- **Routes**: Define endpoints and validate requests
- **Services**: Implement business logic and orchestrate operations
- **Models**: Handle data access and persistence

### 2. Schema-Based State Management

- Use Colyseus schemas for state that needs to be synchronized
- Define explicit types for all state properties
- Implement change detection for efficient network updates

### 3. Asynchronous Processing

- Use async/await for all I/O operations
- Implement proper error handling for asynchronous code
- Provide meaningful error responses

### 4. Configuration Through Environment

- Store sensitive information in environment variables
- Use .env files for local development
- Provide .env.example as a template

## Reusable Components

### 1. Database Interface (models/database.js)

```javascript
// Example usage:
const database = require('../models/database');

// Get all characters
const characters = await database.getCharacters();

// Get a specific character
const character = await database.getCharacter(characterId);

// Save a conversation
const conversation = await database.saveConversation(userId, characterId, title);

// Add a message to a conversation
await database.addMessage(conversationId, senderType, messageText);
```

### 2. AIService (game/AIService.js)

```javascript
// Example usage:
const AIService = require('../game/AIService');
const aiService = new AIService();

// Generate a response
const response = await aiService.generateResponse(characterId, message, conversationHistory);

// Add conversation to history
const conversationId = await aiService.addConversationToHistory(
  userId, characterId, conversationTitle, userMessage, aiResponse
);
```

### 3. Colyseus Room (game/HistoryRoom.js)

```javascript
// Room registration:
const { HistoryRoom } = require('../game/HistoryRoom');
gameServer.define('history_room', HistoryRoom);

// Message handling within the room:
this.onMessage('message', (client, data) => {
  this.handleChatMessage(client, data);
});
```

## Development Workflow

### Local Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env.example` to `.env` and update values
4. Initialize the database: `npx prisma migrate dev`
5. Seed the database: `npm run seed`
6. Start the server: `npm run dev`

### API Testing

- Use tools like Postman or curl to test HTTP endpoints
- Use Socket.IO and Colyseus client libraries for testing WebSocket communication

### Database Operations

- Use Prisma Client API for database operations
- Use `npx prisma studio` for a visual database editor
- Use migrations for schema changes: `npx prisma migrate dev --name <migration-name>`

## Best Practices for AI Assistants

When developing or maintaining this codebase, AI assistants should:

1. **Follow Existing Patterns**: Match the style and structure of existing components
2. **Maintain Error Handling**: Always implement proper try/catch blocks for error handling
3. **Document New Features**: Add inline documentation and update this overview when needed
4. **Structure API Endpoints Consistently**: 
   - Use descriptive route names following the established pattern
   - Implement validation for all incoming requests
   - Return standardized JSON responses
5. **Use Async/Await**: Use async/await pattern for all asynchronous operations
6. **Leverage Existing Utilities**: Use the database abstraction and AIService rather than creating alternatives

## Deployment

The application is designed to be deployed as a single service with both backend and frontend components. In production:

- The Express server serves the frontend static files from the `frontend/dist` directory
- All API endpoints are available under the `/api` path
- WebSocket connections use the same domain as the HTTP API
- The Colyseus monitor is available at `/colyseus` (protected in production)

## Conclusion

This architecture overview provides a foundation for understanding and contributing to the backend of the 3D AI Game application. By following the established patterns and leveraging the reusable components, developers can efficiently extend the application while maintaining consistency and quality. 