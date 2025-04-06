import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import RealisticHuman from './RealisticHuman';

// Predefined character configurations
const CHARACTERS = [
  {
    gender: 'female',
    skinTone: '#e1c4a8',
    hairColor: '#3a2819',
    position: [-2, 0, 0],
    rotation: [0, 0.3, 0]
  },
  {
    gender: 'male',
    skinTone: '#d1a586',
    hairColor: '#1a1a1a',
    position: [0, 0, 0],
    rotation: [0, 0, 0]
  },
  {
    gender: 'female',
    skinTone: '#8d5524',
    hairColor: '#2e1a00',
    position: [2, 0, 0],
    rotation: [0, -0.3, 0]
  },
  {
    gender: 'male',
    skinTone: '#c58c65',
    hairColor: '#760c0c',
    position: [4, 0, 0],
    rotation: [0, -0.6, 0]
  }
];

const MultipleHumans = () => {
  const [cameraTarget, setCameraTarget] = useState([0, 0.5, 0]);
  
  const handleCharacterClick = (position) => {
    setCameraTarget([position[0], 1, position[2]]);
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
      >
        {/* Environment */}
        <color attach="background" args={['#101020']} />
        <fog attach="fog" args={['#101020', 5, 30]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <spotLight 
          intensity={1.5} 
          position={[5, 10, 7.5]} 
          angle={0.5} 
          penumbra={1} 
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <spotLight 
          intensity={0.8} 
          position={[-5, 5, -5]} 
          angle={0.5} 
          penumbra={1} 
          castShadow 
          color="#a0a0ff"
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight 
          position={[0, 5, 5]} 
          intensity={0.5}
        />
        
        {/* Human Characters */}
        {CHARACTERS.map((character, index) => (
          <RealisticHuman
            key={index}
            position={character.position}
            rotation={character.rotation}
            gender={character.gender}
            skinTone={character.skinTone}
            hairColor={character.hairColor}
          />
        ))}
        
        {/* Ground */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -1.5, 0]} 
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#101018" roughness={1} />
        </mesh>
        
        {/* Background elements */}
        <Stars radius={100} depth={50} count={5000} factor={4} />
        
        {/* Camera controls */}
        <OrbitControls
          target={cameraTarget}
          maxPolarAngle={Math.PI / 1.5}
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        left: 20,
        top: 20,
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <h2>3D Human Characters</h2>
        <p>Created with Three.js and React Three Fiber</p>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '8px'
      }}>
        <p>Drag to rotate view • Scroll to zoom • Right-click drag to pan</p>
      </div>
    </div>
  );
};

export default MultipleHumans; 