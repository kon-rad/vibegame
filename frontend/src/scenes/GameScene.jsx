import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// Mock data for historical characters
const HISTORICAL_CHARACTERS = [
  {
    id: 1,
    name: 'Socrates',
    era: 'Ancient Greece, 470-399 BCE',
    avatar: '/assets/avatars/socrates.jpg',
    position: [-3, 0, 0],
    color: '#4287f5'
  },
  {
    id: 2,
    name: 'Leonardo da Vinci',
    era: 'Renaissance Italy, 1452-1519',
    avatar: '/assets/avatars/davinci.jpg',
    position: [0, 0, 0],
    color: '#f54263'
  },
  {
    id: 3,
    name: 'Marie Curie',
    era: 'Modern Poland/France, 1867-1934',
    avatar: '/assets/avatars/curie.jpg',
    position: [3, 0, 0],
    color: '#42f59e'
  }
];

// Character component that represents a historical figure in 3D
const Character = ({ character, onClick, isSelected }) => {
  const meshRef = useRef();
  const { camera } = useThree();
  
  // Simple animation for the character
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      
      // Make the character slightly bounce
      meshRef.current.position.y = character.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  // Handle hover effect
  const [hovered, setHovered] = useState(false);
  
  // Visual feedback when character is hovered/selected
  const color = new THREE.Color(character.color);
  color.lerp(new THREE.Color('white'), hovered ? 0.2 : 0);
  
  if (isSelected) {
    color.lerp(new THREE.Color('gold'), 0.3);
  }
  
  // For now, we'll use simple geometric shapes as placeholders
  // In a real game, you'd load character models here
  return (
    <group position={character.position}>
      <mesh 
        ref={meshRef}
        onClick={() => onClick(character)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color={color.getHex()} metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Character name label */}
      <Text
        position={[0, 1.5, 0]}
        color="white"
        fontSize={0.2}
        maxWidth={2}
        textAlign="center"
        anchorY="bottom"
        lookAt={camera.position}
      >
        {character.name}
      </Text>
      
      {/* Era information shown on hover */}
      {(hovered || isSelected) && (
        <Text
          position={[0, 1.2, 0]}
          color="#aaaaff"
          fontSize={0.12}
          maxWidth={2}
          textAlign="center"
          anchorY="bottom"
          lookAt={camera.position}
        >
          {character.era}
        </Text>
      )}
    </group>
  );
};

// Main game scene component
const GameScene = ({ onCharacterSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // Ground/floor
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };
  
  return (
    <group>
      {/* Environment */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#111133" />
      </mesh>
      
      {/* Historical characters */}
      {HISTORICAL_CHARACTERS.map((character) => (
        <Character 
          key={character.id}
          character={character}
          onClick={handleCharacterClick}
          isSelected={selectedCharacter && selectedCharacter.id === character.id}
        />
      ))}
      
      {/* Instructions */}
      <Text
        position={[0, 3, -5]}
        color="white"
        fontSize={0.3}
        maxWidth={10}
        textAlign="center"
      >
        Select a historical figure to start a conversation
      </Text>
    </group>
  );
};

export default GameScene; 