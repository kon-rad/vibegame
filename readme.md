# Historical Conversations - 3D AI Game

An interactive 3D web-based game where players can converse with historical figures using AI technology. Built with Three.js, React, Node.js, and Colyseus for real-time multiplayer functionality.

## Project Overview

In this game, players can navigate a 3D environment and engage in conversations with notable historical figures. The AI-powered characters respond in the style and with the knowledge of the historical personalities they represent, offering insights into their lives, achievements, and philosophical views.

## Features

- **3D Environment**: Built with Three.js for an immersive experience
- **AI Conversations**: Talk to historical figures like Socrates, Leonardo da Vinci, and Marie Curie
- **Real-time Interaction**: Powered by Colyseus game server
- **Persistence**: SQLite database to store conversations and user progress

## Tech Stack

### Frontend
- Three.js for 3D rendering
- React for UI components
- Vite for fast development and building

### Backend
- Node.js with Express
- Colyseus for game server functionality
- SQLite for database storage

## Getting Started

### Prerequisites
- Node.js and npm installed
- Basic understanding of JavaScript, React, and Three.js

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gameframe.git
cd gameframe
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Development Environment

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a separate terminal, start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Future Enhancements

- Add more historical characters with detailed biographies and realistic responses
- Implement advanced AI model integration for more natural conversations
- Add more 3D environments representing different historical periods
- Incorporate quests and learning objectives
- Add multiplayer interaction between users

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Three.js for the amazing 3D capabilities
- Colyseus for the real-time game server framework
- React for the UI components
- Various open-source libraries and projects that made this possible
