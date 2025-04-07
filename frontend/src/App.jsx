import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Preload, Html } from '@react-three/drei';
import GameScene from './scenes/GameScene';
import ChatInterface from './components/ChatInterface';
import LoadingScreen from './components/LoadingScreen';
import IntroScreen from './components/IntroScreen';
import ConversationsModal from './components/ConversationsModal';
import Minimap from './components/Minimap';
import ConnectionManager from './utils/ConnectionManager';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameConnection, setGameConnection] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [sceneReady, setSceneReady] = useState(false);
  const [environmentData, setEnvironmentData] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [tokensCollected, setTokensCollected] = useState(0);
  const [playerPosition, setPlayerPosition] = useState([0, 0, 5]);
  const [userId, setUserId] = useState(1); // Mock user ID - in a real app, get from auth
  const [showConversations, setShowConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    // Initialize connection to game server
    const connection = new ConnectionManager();
    setGameConnection(connection);
    
    // Set up connection and message listeners
    const checkEnvironment = async () => {
      try {
        // Attempt to get environment data (characters, etc.)
        const data = await connection.getEnvironmentData();
        if (data && data.characters) {
          setCharacters(data.characters);
          setIsLoading(false);
          console.log('Environment data loaded successfully');
        } else {
          // Retry if data not available yet
          let retries = 10;
          const retryInterval = setInterval(async () => {
            try {
              const retryData = await connection.getEnvironmentData();
              if (retryData && retryData.characters) {
                setCharacters(retryData.characters);
                setIsLoading(false);
                console.log('Environment data loaded on retry');
                clearInterval(retryInterval);
              } else {
                retries--;
                if (retries <= 0) {
                  clearInterval(retryInterval);
                  throw new Error('Failed to load environment data after retries');
                }
              }
            } catch (error) {
              console.error('Error during retry:', error);
              clearInterval(retryInterval);
              setConnectionError('Unable to connect to game server. Please try again later.');
              setIsLoading(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking environment:', error);
        setConnectionError('Unable to connect to game server. Please try again later.');
        setIsLoading(false);
      }
    };
    
    checkEnvironment();
    
    // Set up message listener to receive updates
    const removeListener = connection.listenForMessages((message) => {
      if (message.type === 'character_moved') {
        // Update character position in state
        setCharacters(prevCharacters => {
          return prevCharacters.map(char => {
            if (char.id.toString() === message.characterId.toString()) {
              return {
                ...char,
                position: message.position,
                isMoving: message.isMoving,
                isInteracting: message.isInteracting
              };
            }
            return char;
          });
        });
      } else {
        // Handle regular chat messages
        setChatMessages(prevMessages => [...prevMessages, {
          sender: message.senderId === 'character' ? 'character' : 'user',
          text: message.text,
          timestamp: message.createdAt || new Date().toISOString()
        }]);
      }
    });
    
    // Clean up on unmount
    return () => {
      removeListener && removeListener();
      connection.disconnect();
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
      const result = await gameConnection.sendMessage(
        currentCharacter.id, 
        message,
        userId,
        activeConversationId
      );
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      
      if (result.success) {
        if (result.channel === 'api' && result.data) {
          // Update conversation ID if it's a new conversation
          if (result.data.conversationId) {
            setActiveConversationId(result.data.conversationId);
          }
          
          // Add response from API
          setChatMessages(prev => [...prev, { 
            sender: 'character', 
            character: result.data.character,
            text: result.data.message 
          }]);
          
          // Check if token was earned (this would come from backend in real implementation)
          if (result.data.message.toLowerCase().includes('token') && 
              Math.random() > 0.7) { // Simulating token earning chance
            setTokensCollected(prev => prev + 1);
            setChatMessages(prev => [...prev, { 
              sender: 'system', 
              text: `Congratulations! You earned a token from ${result.data.character}!`,
              isToken: true
            }]);
          }
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

  const handleStartGame = () => {
    setShowIntro(false);
    setGameStarted(true);
  };

  const handleCharacterSelect = (character) => {
    setCurrentCharacter(character);
    setChatMessages([]);
    setActiveConversationId(null);
  };

  const loadConversation = async (conversationId) => {
    if (!gameConnection) return;
    
    try {
      const conversation = await gameConnection.loadConversation(conversationId);
      
      if (!conversation) {
        throw new Error('Failed to load conversation');
      }
      
      // Find the character
      const character = characters.find(c => c.id === conversation.character.id);
      if (character) {
        setCurrentCharacter(character);
      }
      
      // Format messages for chat display
      const formattedMessages = conversation.messages.map(msg => ({
        sender: msg.senderType === 'user' ? 'user' : 'character',
        text: msg.text,
        character: msg.senderType === 'character' ? conversation.character.name : null
      }));
      
      // Set active conversation and messages
      setActiveConversationId(conversationId);
      setChatMessages(formattedMessages);
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      setChatMessages([
        { 
          sender: 'system', 
          text: 'Error: Could not load conversation. Please try again.' 
        }
      ]);
    }
  };

  // Callback to receive player position updates from GameScene
  const handlePlayerMove = useCallback((newPosition) => {
    setPlayerPosition(newPosition);
    // Optionally, send position to backend if needed for Colyseus
    // gameConnection?.sendPlayerPosition(newPosition);
  }, [gameConnection]);

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
      {showIntro && <IntroScreen onStart={handleStartGame} />}
      
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
            onCharacterSelect={handleCharacterSelect}
            isPlayerActive={gameStarted}
            onPlayerMove={handlePlayerMove}
          />
          <Preload all />
        </Suspense>
        
        <Stars radius={100} depth={50} count={5000} factor={4} />
        {!gameStarted && (
          <OrbitControls 
            enablePan={false}
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        )}
      </Canvas>
      
      {currentCharacter && (
        <ChatInterface 
          character={currentCharacter}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      )}
      
      {gameStarted && (
        <>
          <div className="app-info">
            <h1>Historical Tokens</h1>
            <p>Interact with historical figures and collect their tokens</p>
          </div>
          
          <div className="token-counter">
            <span className="token-icon">🪙</span>
            <span className="token-count">{tokensCollected}</span>
          </div>
          
          <button 
            className="conversations-button"
            onClick={() => setShowConversations(true)}
          >
            <span>💬</span>
            My Conversations
          </button>
          
          <Minimap 
            playerPosition={playerPosition} 
            characters={characters} 
            worldSize={50}
            mapSize={150}
          />
          
          <div className="controls-hint">
            <p>WASD: Move | Mouse: Look | Click: Interact</p>
          </div>
        </>
      )}
      
      {showConversations && (
        <ConversationsModal 
          userId={userId}
          onSelectConversation={loadConversation}
          onClose={() => setShowConversations(false)}
        />
      )}
      
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
        
        .token-counter {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.5);
          color: gold;
          padding: 8px 15px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          font-weight: bold;
          font-size: 1.2em;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        .token-icon {
          margin-right: 8px;
          font-size: 1.4em;
        }
        
        .conversations-button {
          position: absolute;
          top: 80px;
          right: 20px;
          background: rgba(30, 50, 100, 0.8);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 20px;
          font-weight: bold;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          font-size: 0.9em;
        }
        
        .conversations-button:hover {
          background: rgba(40, 70, 150, 0.9);
        }
        
        .conversations-button span {
          margin-right: 8px;
          font-size: 1.2em;
        }
        
        .controls-hint {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          text-align: center;
          pointer-events: none;
          opacity: 0.8;
          transition: opacity 0.5s ease;
        }
        
        .controls-hint p {
          margin: 0;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

export default App; 