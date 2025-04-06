import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import RealisticHuman from './RealisticHuman';

// This component shows a configurable human model
const HumanTest = () => {
  const [gender, setGender] = useState('female');
  const [skinTone, setSkinTone] = useState('#e1c4a8');
  const [hairColor, setHairColor] = useState('#3a2819');
  const [rotation, setRotation] = useState(0);
  
  // Rotate character slowly
  React.useEffect(() => {
    const timer = setInterval(() => {
      setRotation(prev => (prev + 0.01) % (Math.PI * 2));
    }, 50);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 1.5, 3.5], fov: 50 }}
      >
        {/* Environment */}
        <color attach="background" args={['#101020']} />
        <fog attach="fog" args={['#101020', 5, 30]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <spotLight 
          intensity={1} 
          position={[5, 10, 7.5]} 
          angle={0.5} 
          penumbra={1} 
          castShadow 
        />
        <spotLight 
          intensity={0.5} 
          position={[-5, 5, -5]} 
          angle={0.5} 
          penumbra={1} 
          castShadow 
          color="#a0a0ff" 
        />
        <directionalLight 
          position={[0, 5, 5]} 
          intensity={0.5} 
        />
        
        {/* Character */}
        <RealisticHuman 
          position={[0, 0, 0]}
          rotation={[0, rotation, 0]}
          gender={gender}
          skinTone={skinTone}
          hairColor={hairColor}
        />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#101018" roughness={1} />
        </mesh>
        
        {/* Background elements */}
        <Stars radius={100} depth={50} count={5000} factor={4} />
        
        {/* Camera controls */}
        <OrbitControls 
          target={[0, 0.5, 0]} 
          maxPolarAngle={Math.PI / 1.5} 
          minDistance={2} 
          maxDistance={8}
        />
      </Canvas>
      
      {/* UI Controls */}
      <div style={{
        position: 'absolute',
        right: 20,
        top: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: 15,
        borderRadius: 8,
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Human Customization</h3>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            Gender:
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              style={{ marginLeft: 10, background: '#333', color: 'white', border: 'none', padding: 5 }}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            Skin Tone:
            <input 
              type="color" 
              value={skinTone} 
              onChange={(e) => setSkinTone(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            Hair Color:
            <input 
              type="color" 
              value={hairColor} 
              onChange={(e) => setHairColor(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          </label>
        </div>
        
        <div style={{ fontSize: 12, marginTop: 15, opacity: 0.7 }}>
          Use mouse to orbit, zoom and pan
        </div>
      </div>
    </div>
  );
};

export default HumanTest; 