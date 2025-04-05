import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ character, messages, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;
    
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="character-info">
          <h3>{character.name}</h3>
          <p>{character.era}</p>
        </div>
        <div className="character-avatar">
          <img src={character.avatar} alt={character.name} />
        </div>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Start a conversation with {character.name}!</p>
            <p>Ask about their life, achievements, or philosophical views.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender === 'user' ? 'user-message' : 'character-message'}`}
            >
              {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask ${character.name} something...`}
        />
        <button type="submit">Send</button>
      </form>
      
      <style jsx>{`
        .chat-interface {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 350px;
          height: 500px;
          background-color: rgba(15, 15, 30, 0.85);
          border-radius: 8px 0 0 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .character-avatar img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .welcome-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          margin: auto 0;
        }
        
        .message {
          max-width: 80%;
          padding: 10px;
          border-radius: 10px;
          word-break: break-word;
        }
        
        .user-message {
          background-color: #2a68db;
          align-self: flex-end;
          border-radius: 15px 15px 0 15px;
        }
        
        .character-message {
          background-color: #333342;
          align-self: flex-start;
          border-radius: 15px 15px 15px 0;
        }
        
        .message-input {
          display: flex;
          padding: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .message-input input {
          flex: 1;
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 20px;
          padding: 10px 15px;
          color: white;
          outline: none;
        }
        
        .message-input button {
          background-color: #2a68db;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0 15px;
          margin-left: 10px;
          cursor: pointer;
        }
        
        .message-input button:hover {
          background-color: #1d54ba;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface; 