import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Main component
const RealisticHuman = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  skinTone = '#e1c4a8',
  hairColor = '#3a2819',
  gender = 'female'
}) => {
  const group = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  
  // Basic materials for different body parts
  const skinMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.5,
      metalness: 0.1
    }), [skinTone]);
  
  const hairMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.8,
      metalness: 0.1
    }), [hairColor]);
  
  const eyeMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: '#305070',
      roughness: 0.1,
      metalness: 0.2
    }), []);
  
  const clothingMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: gender === 'female' ? '#d35f85' : '#2c4870', 
      roughness: 0.8,
      metalness: 0.1
    }), [gender]);
  
  // Animation cycle
  useFrame((state, delta) => {
    if (group.current && bodyRef.current) {
      // Subtle breathing animation
      const t = state.clock.getElapsedTime();
      bodyRef.current.position.y = Math.sin(t * 0.5) * 0.03;
      bodyRef.current.rotation.y = Math.sin(t * 0.2) * 0.05;
    }
  });
  
  // Create head shape
  const headGeometry = useMemo(() => {
    return gender === 'female' 
      ? new THREE.SphereGeometry(0.4, 32, 32) // Female head
      : new THREE.SphereGeometry(0.42, 32, 32); // Male head
  }, [gender]);
  
  // Create body shape
  const bodyGeometry = useMemo(() => {
    if (gender === 'female') {
      // Female body shape
      const torso = new THREE.CapsuleGeometry(0.3, 0.8, 16, 32);
      return torso;
    } else {
      // Male body shape
      const torso = new THREE.CapsuleGeometry(0.35, 0.7, 16, 32);
      return torso;
    }
  }, [gender]);
  
  return (
    <group ref={group} position={position} rotation={rotation}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={skinTone} roughness={0.5} />
        
        {/* Eyes */}
        <group>
          <mesh position={[-0.15, 0.05, 0.32]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
            
            {/* Pupil */}
            <mesh position={[0, 0, 0.065]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            
            {/* Highlight */}
            <mesh position={[0.02, 0.02, 0.065]}>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </mesh>
          
          <mesh position={[0.15, 0.05, 0.32]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
            
            {/* Pupil */}
            <mesh position={[0, 0, 0.065]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            
            {/* Highlight */}
            <mesh position={[0.02, 0.02, 0.065]}>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </mesh>
        </group>
        
        {/* Mouth */}
        <mesh position={[0, -0.15, 0.35]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.2, 0.03, 0.01]} />
          <meshBasicMaterial color="#5c3326" />
        </mesh>
        
        {/* Nose */}
        <mesh position={[0, -0.05, 0.4]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
        
        {/* Hair */}
        <mesh position={[0, 0.05, 0]} castShadow>
          {gender === 'female' ? (
            <sphereGeometry args={[0.44, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          ) : (
            <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          )}
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        
        {/* Female longer hair */}
        {gender === 'female' && (
          <group position={[0, -0.2, 0]}>
            <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.2]}>
              <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.2]}>
              <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, -0.2]}>
              <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </group>
        )}
      </mesh>
      
      {/* Body */}
      <group ref={bodyRef}>
        {/* Neck */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
        
        {/* Torso */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[
            gender === 'female' ? 0.3 : 0.35, 
            gender === 'female' ? 0.8 : 0.7, 
            16, 32
          ]} />
          <meshStandardMaterial color={gender === 'female' ? '#d35f85' : '#2c4870'} roughness={0.8} />
        </mesh>
        
        {/* Arms */}
        <group>
          {/* Left Arm */}
          <mesh position={[0.4, 0.9, 0]} rotation={[0, 0, -0.2]} castShadow>
            <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
          <mesh position={[0.55, 0.5, 0]} rotation={[0, 0, -0.5]} castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
          <mesh position={[0.7, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
          
          {/* Right Arm */}
          <mesh position={[-0.4, 0.9, 0]} rotation={[0, 0, 0.2]} castShadow>
            <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
          <mesh position={[-0.55, 0.5, 0]} rotation={[0, 0, 0.5]} castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
          <mesh position={[-0.7, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.5} />
          </mesh>
        </group>
        
        {/* Legs */}
        <group>
          {/* Left Leg */}
          <mesh position={[0.15, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.7, 8, 16]} />
            {gender === 'female' ? (
              <meshStandardMaterial color="#000000" roughness={0.8} />
            ) : (
              <meshStandardMaterial color="#2c4870" roughness={0.8} />
            )}
          </mesh>
          <mesh position={[0.15, -0.8, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
            {gender === 'female' ? (
              <meshStandardMaterial color={skinTone} roughness={0.5} />
            ) : (
              <meshStandardMaterial color="#2c4870" roughness={0.8} />
            )}
          </mesh>
          <mesh position={[0.15, -1.4, 0.1]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.15, 0.1, 0.3]} />
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </mesh>
          
          {/* Right Leg */}
          <mesh position={[-0.15, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.7, 8, 16]} />
            {gender === 'female' ? (
              <meshStandardMaterial color="#000000" roughness={0.8} />
            ) : (
              <meshStandardMaterial color="#2c4870" roughness={0.8} />
            )}
          </mesh>
          <mesh position={[-0.15, -0.8, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
            {gender === 'female' ? (
              <meshStandardMaterial color={skinTone} roughness={0.5} />
            ) : (
              <meshStandardMaterial color="#2c4870" roughness={0.8} />
            )}
          </mesh>
          <mesh position={[-0.15, -1.4, 0.1]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.15, 0.1, 0.3]} />
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export default RealisticHuman; 