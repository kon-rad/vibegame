import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import GameScene from './scenes/GameScene';
import ChatInterface from './components/ChatInterface';
import LoadingScreen from './components/LoadingScreen';
import ConnectionManager from './utils/ConnectionManager';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameConnection, setGameConnection] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    // Simulate loading assets
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Initialize connection to game server
    const connection = new ConnectionManager();
    setGameConnection(connection);

    return () => {
      clearTimeout(loadingTimer);
      if (connection) {
        connection.disconnect();
      }
    };
  }, []);

  const handleSendMessage = (message) => {
    if (!gameConnection || !currentCharacter) return;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    // Here we would normally send the message to the server
    // and get a response from the AI
    
    // Simulate AI response for now
    setTimeout(() => {
      const characterResponse = `I am ${currentCharacter.name}, and I'm thinking about your message: "${message}"`;
      setChatMessages(prev => [...prev, { sender: 'character', text: characterResponse }]);
    }, 1000);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 75 }}>
        <color attach="background" args={['#191920']} />
        <fog attach="fog" args={['#191920', 0, 15]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <GameScene 
          onCharacterSelect={setCurrentCharacter} 
        />
        <OrbitControls />
        <Environment preset="city" />
      </Canvas>
      
      {currentCharacter && (
        <ChatInterface 
          character={currentCharacter}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}

export default App; 