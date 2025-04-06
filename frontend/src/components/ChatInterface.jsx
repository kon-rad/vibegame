import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ character, messages, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when character changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [character]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;
    
    onSendMessage(inputMessage);
    setInputMessage('');
    
    // Simulate "typing" effect for character response
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="character-info">
          <h3>{character.name}</h3>
          <p className="era">{character.era}</p>
          {character.specialty && (
            <p className="specialty">Specialty: {character.specialty}</p>
          )}
        </div>
        <div className="character-avatar">
          <div className="avatar-frame">
            <img src={character.avatar} alt={character.name} />
          </div>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h4>Start a conversation with {character.name}!</h4>
            {character.bio && <p className="character-bio">{character.bio}</p>}
            <p>Ask about their life, achievements, or philosophical views.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender === 'user' ? 'user-message' : 'character-message'}`}
            >
              {msg.sender === 'character' && (
                <div className="message-avatar">
                  <img src={character.avatar} alt={character.name} />
                </div>
              )}
              <div className="message-content">
                {msg.sender === 'character' && (
                  <span className="message-sender">{character.name}</span>
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="message character-message typing-indicator">
            <div className="message-avatar">
              <img src={character.avatar} alt={character.name} />
            </div>
            <div className="message-content">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask ${character.name} something...`}
        />
        <button type="submit">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
      
      <style jsx>{`
        .chat-interface {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 400px;
          height: 500px;
          background-color: rgba(15, 15, 30, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 12px 0 0 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(20, 20, 40, 0.5);
          border-radius: 12px 0 0 0;
        }
        
        .character-info {
          flex: 1;
        }
        
        .character-info h3 {
          margin: 0;
          color: white;
          font-size: 1.2em;
        }
        
        .character-info .era {
          margin: 5px 0 0;
          color: #aaaaff;
          font-size: 0.8em;
          opacity: 0.8;
        }
        
        .character-info .specialty {
          margin: 3px 0 0;
          color: #aaffaa;
          font-size: 0.8em;
          opacity: 0.8;
        }
        
        .character-avatar {
          margin-left: 15px;
        }
        
        .avatar-frame {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid ${character.color || '#4287f5'};
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        .character-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
        }
        
        .welcome-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          margin: auto 0;
          padding: 20px;
        }
        
        .welcome-message h4 {
          margin: 0 0 10px;
          color: white;
        }
        
        .character-bio {
          font-style: italic;
          line-height: 1.4;
          margin: 10px 0;
          padding: 10px;
          border-left: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .message {
          max-width: 90%;
          display: flex;
          gap: 10px;
        }
        
        .user-message {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .character-message {
          align-self: flex-start;
        }
        
        .message-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .message-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .message-content {
          background-color: ${character.primaryColor || character.color || '#4287f5'};
          padding: 10px 15px;
          border-radius: 18px;
          color: white;
          position: relative;
        }
        
        .user-message .message-content {
          background-color: #2a68db;
          border-radius: 18px 18px 0 18px;
        }
        
        .character-message .message-content {
          background-color: ${character.primaryColor || character.color || '#4287f5'};
          border-radius: 0 18px 18px 18px;
        }
        
        .message-sender {
          display: block;
          font-size: 0.8em;
          font-weight: bold;
          margin-bottom: 3px;
          opacity: 0.9;
        }
        
        .message-text {
          line-height: 1.4;
          word-break: break-word;
        }
        
        .typing-indicator .message-content {
          padding: 15px;
          min-width: 40px;
        }
        
        .typing {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .typing span {
          display: block;
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }
        
        .typing span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .message-input {
          display: flex;
          padding: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(20, 20, 40, 0.5);
        }
        
        .message-input input {
          flex: 1;
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 24px;
          padding: 12px 20px;
          color: white;
          outline: none;
          font-size: 1em;
        }
        
        .message-input input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .message-input button {
          background-color: ${character.primaryColor || character.color || '#4287f5'};
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin-left: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background-color 0.2s;
        }
        
        .message-input button svg {
          width: 20px;
          height: 20px;
        }
        
        .message-input button:hover {
          background-color: ${character.color || '#4287f5'};
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default ChatInterface; 