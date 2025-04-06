import React from 'react';
import ConversationList from './ConversationList';

const ConversationsModal = ({ userId, onSelectConversation, onClose }) => {
  // Close modal when clicking outside the modal content
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className="modal-content conversations-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="modal-title">Your Conversations</h2>
        
        <ConversationList 
          userId={userId} 
          onSelectConversation={(conversationId) => {
            onSelectConversation(conversationId);
            onClose();
          }} 
        />
        
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
            backdrop-filter: blur(5px);
          }
          
          .modal-content {
            background: rgba(20, 20, 40, 0.95);
            border-radius: 12px;
            padding: 25px;
            position: relative;
            width: 100%;
            max-width: 550px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(100, 100, 255, 0.3);
          }
          
          .close-button {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 15px;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
          }
          
          .close-button:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          .modal-title {
            color: white;
            font-size: 1.5rem;
            margin-top: 0;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .conversations-modal {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ConversationsModal; 