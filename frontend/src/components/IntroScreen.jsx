import React from 'react';

function IntroScreen({ onStart }) {
  return (
    <div className="intro-screen">
      <div className="intro-content">
        <h1>Welcome to Historical Tokens</h1>
        
        <div className="intro-description">
          <h2>How to Play</h2>
          <p>
            In this game, you'll interact with famous historical characters who each possess a special token.
          </p>
          
          <ul>
            <li>Each character has their own unique story and personality</li>
            <li>They will ask you to complete tasks or solve problems for them</li>
            <li>Engage in meaningful conversations to gain their trust</li>
            <li>Successfully help them to earn their tokens</li>
            <li>Try to collect as many tokens as possible!</li>
          </ul>
          
          <p className="tip">
            <strong>Tip:</strong> Pay attention to each character's dialogue style and interests. 
            Using the right approach will help you earn their tokens more quickly!
          </p>
        </div>
        
        <div className="world-preview">
          <div className="world-image"></div>
          <p>Enter a beautiful 3D world with grassy plains, trees, and historical figures</p>
        </div>
        
        <button className="start-button" onClick={onStart}>
          <span className="button-text">Enter the World</span>
          <span className="button-icon">→</span>
        </button>
      </div>
      
      <style jsx>{`
        .intro-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(3, 4, 32, 0.9);
          z-index: 1000;
          color: white;
        }
        
        .intro-content {
          background: rgba(26, 26, 46, 0.8);
          border-radius: 12px;
          padding: 40px;
          max-width: 650px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 30px;
          background: linear-gradient(to right, #c9d6ff, #e2e2e2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        h2 {
          font-size: 1.8rem;
          margin-bottom: 15px;
          color: #b8c6db;
        }
        
        p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        ul {
          margin-bottom: 25px;
          padding-left: 20px;
        }
        
        li {
          margin-bottom: 10px;
          font-size: 1.05rem;
          line-height: 1.5;
        }
        
        .tip {
          background: rgba(74, 105, 189, 0.3);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #4a69bd;
        }
        
        .world-preview {
          margin: 30px 0;
          text-align: center;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .world-image {
          height: 120px;
          background: linear-gradient(to bottom, #87CEEB, #8FBC8F);
          position: relative;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .world-image:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: #8FBC8F;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .world-image:before {
          content: '';
          position: absolute;
          width: 30px;
          height: 60px;
          background: #228B22;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 100% 100% 0 0 / 50% 50% 0 0;
          box-shadow: -20px 10px 0 #006400, 30px 5px 0 #228B22;
        }
        
        .start-button {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 30px auto 0;
          padding: 18px 50px;
          font-size: 1.3rem;
          background: linear-gradient(45deg, #4a69bd, #1e3799);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(30, 55, 153, 0.4);
        }
        
        .button-text {
          margin-right: 10px;
        }
        
        .button-icon {
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }
        
        .start-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(30, 55, 153, 0.5);
        }
        
        .start-button:hover .button-icon {
          transform: translateX(5px);
        }
        
        .start-button:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
}

export default IntroScreen; 