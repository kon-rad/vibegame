import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1>History Conversations</h1>
        <div className="loading-spinner"></div>
        <p>Loading the historical experience...</p>
      </div>
      <style jsx>{`
        .loading-screen {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #0f0f1a;
          color: white;
          z-index: 1000;
        }
        
        .loading-content {
          text-align: center;
        }
        
        h1 {
          margin-bottom: 2rem;
          font-size: 2.5rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          margin: 1rem auto;
          border: 5px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen; 