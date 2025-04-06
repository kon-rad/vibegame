import React, { useState, useEffect } from 'react';

const ConversationList = ({ userId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        
        // Use a mock user ID if not provided
        const userIdToUse = userId || 1;
        
        const response = await fetch(`/api/conversation/user/${userIdToUse}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await response.json();
        setConversations(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="conversation-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-list-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="conversation-list-empty">
        <h3>No conversations yet</h3>
        <p>Start a conversation with a historical figure to see it here.</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      <h3 className="conversation-list-title">Your Conversations</h3>
      <div className="conversation-items">
        {conversations.map(conversation => {
          const lastMessage = conversation.messages[0]?.text || '';
          const preview = lastMessage.length > 50 
            ? lastMessage.substring(0, 50) + '...' 
            : lastMessage;
          
          return (
            <div 
              key={conversation.id} 
              className="conversation-item"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-avatar">
                <img 
                  src={conversation.character.avatar} 
                  alt={conversation.character.name} 
                />
              </div>
              <div className="conversation-details">
                <h4 className="conversation-title">{conversation.title}</h4>
                <p className="conversation-character-name">
                  {conversation.character.name}
                </p>
                <p className="conversation-preview">{preview}</p>
                <p className="conversation-date">
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .conversation-list {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 10px;
          padding: 20px;
          color: white;
          max-height: 70vh;
          overflow-y: auto;
          width: 100%;
          max-width: 500px;
        }
        
        .conversation-list-title {
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 10px;
        }
        
        .conversation-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .conversation-item {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .conversation-item:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .conversation-avatar {
          width: 50px;
          height: 50px;
          margin-right: 15px;
          border-radius: 25px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .conversation-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .conversation-details {
          flex: 1;
        }
        
        .conversation-title {
          margin: 0 0 5px 0;
          font-size: 1rem;
        }
        
        .conversation-character-name {
          color: #a0a0ff;
          margin: 0 0 5px 0;
          font-size: 0.9rem;
        }
        
        .conversation-preview {
          opacity: 0.7;
          margin: 0 0 5px 0;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        
        .conversation-date {
          font-size: 0.8rem;
          opacity: 0.6;
          text-align: right;
          margin: 0;
        }
        
        .conversation-list-loading,
        .conversation-list-error,
        .conversation-list-empty {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 10px;
          padding: 20px;
          color: white;
          text-align: center;
          width: 100%;
          max-width: 500px;
        }
        
        .loading-spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid white;
          width: 30px;
          height: 30px;
          margin: 0 auto 15px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConversationList; 