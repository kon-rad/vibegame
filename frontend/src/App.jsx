import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Preload, Html } from '@react-three/drei';
import GameScene from './scenes/GameScene';
import ChatInterface from './components/ChatInterface';
import LoadingScreen from './components/LoadingScreen';
import ConnectionManager from './utils/ConnectionManager';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameConnection, setGameConnection] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [sceneReady, setSceneReady] = useState(false);
  const [environmentData, setEnvironmentData] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Initialize connection to game server
    const connection = new ConnectionManager();
    setGameConnection(connection);
    
    // Wait for environment data to load
    const checkEnvironmentData = async () => {
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        const data = connection.getEnvironmentData();
        if (data) {
          setEnvironmentData(data);
          setCharacters(data.characters || []);
          setIsLoading(false);
          return;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // If we get here, we timed out waiting for data
      setConnectionError('Failed to load environment data. Please refresh the page.');
      setIsLoading(false);
    };
    
    checkEnvironmentData();
    
    // Try to join the game room
    const joinRoom = async () => {
      try {
        const room = await connection.joinGameRoom();
        if (room) {
          console.log('Successfully joined game room');
          
          // Set up message listener
          connection.listenForMessages((message) => {
            console.log('Received message from room:', message);
            if (message.character && message.message) {
              setChatMessages(prev => [...prev, { 
                sender: 'character', 
                character: message.character,
                text: message.message 
              }]);
            }
          });
        }
      } catch (error) {
        console.error('Failed to join game room:', error);
      }
    };
    
    joinRoom();
    
    return () => {
      if (connection) {
        connection.disconnect();
      }
    };
  }, []);

  const handleSendMessage = async (message) => {
    if (!gameConnection || !currentCharacter) return;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    // Show typing indicator
    setChatMessages(prev => [...prev, { 
      sender: 'character', 
      character: currentCharacter.name,
      isTyping: true 
    }]);
    
    // Send message to server
    try {
      const result = await gameConnection.sendMessage(currentCharacter.id, message);
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      
      if (result.success) {
        if (result.channel === 'api' && result.data) {
          // Add response from API
          setChatMessages(prev => [...prev, { 
            sender: 'character', 
            character: result.data.character,
            text: result.data.message 
          }]);
        }
        // If using colyseus, the response will come through the message listener
      } else {
        // Show error message
        setChatMessages(prev => [...prev, { 
          sender: 'system', 
          text: `Error: Could not send message. ${result.error || 'Please try again.'}` 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Show error message
      setChatMessages(prev => [...prev, { 
        sender: 'system', 
        text: 'Error: Could not send message. Please try again.' 
      }]);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (connectionError) {
    return (
      <div className="error-container">
        <h2>Connection Error</h2>
        <p>{connectionError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
        
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: white;
            background-color: #1a1a2e;
            padding: 20px;
            text-align: center;
          }
          
          button {
            margin-top: 20px;
            background-color: #4a69bd;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          
          button:hover {
            background-color: #1e3799;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: true }}
        camera={{ position: [0, 5, 10], fov: 50 }}
      >
        <color attach="background" args={['#030420']} />
        <fog attach="fog" args={['#030420', 5, 30]} />
        
        <ambientLight intensity={0.2} />
        <directionalLight
          castShadow
          position={[2.5, 8, 5]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera 
            attach="shadow-camera" 
            args={[-10, 10, -10, 10, 0.1, 50]} 
          />
        </directionalLight>
        
        <pointLight position={[-10, 0, -20]} color="#3040c0" intensity={1} />
        <pointLight position={[0, -10, 0]} color="#c03040" intensity={0.5} />
        
        <Suspense fallback={
          <Html center>
            <div style={{ color: 'white', fontSize: '2em' }}>
              Loading Scene...
            </div>
          </Html>
        }>
          <GameScene 
            characters={characters}
            onCharacterSelect={setCurrentCharacter} 
          />
          <Preload all />
        </Suspense>
        
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <OrbitControls 
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </Canvas>
      
      {currentCharacter && (
        <ChatInterface 
          character={currentCharacter}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      )}
      
      <div className="app-info">
        <h1>Historical Conversations</h1>
        <p>Interact with historical figures in a 3D environment</p>
      </div>
      
      <style jsx>{`
        .app-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        
        .app-info {
          position: absolute;
          top: 20px;
          left: 20px;
          color: white;
          text-shadow: 0 0 5px black;
          pointer-events: none;
        }
        
        .app-info h1 {
          margin: 0;
          font-size: 2em;
        }
        
        .app-info p {
          margin: 5px 0 0;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default App; 