import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import Environment from './Environment';
import HumanoidCharacter from '../components/HumanoidCharacter';

// Fallback data in case server is unavailable
const FALLBACK_CHARACTERS = [
  {
    id: 1,
    name: 'Socrates',
    era: 'Ancient Greece, 470-399 BCE',
    bio: 'Athenian philosopher who is credited as the founder of Western philosophy.',
    avatar: '/assets/avatars/socrates.jpg',
    position: [-5, 0, 0],
    color: '#4287f5',
    primaryColor: '#8ca9ff',
    skinColor: '#e9c9a8',
    specialty: 'Dialectic method, ethics, epistemology'
  },
  {
    id: 2,
    name: 'Leonardo da Vinci',
    era: 'Renaissance Italy, 1452-1519',
    bio: 'Italian polymath whose interests included invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography.',
    avatar: '/assets/avatars/davinci.jpg',
    position: [0, 0, 0],
    color: '#f54263',
    primaryColor: '#c74e36',
    skinColor: '#f0d0b0',
    specialty: 'Art, science, engineering, anatomy'
  },
  {
    id: 3,
    name: 'Marie Curie',
    era: 'Modern Poland/France, 1867-1934',
    bio: 'Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.',
    avatar: '/assets/avatars/curie.jpg',
    position: [5, 0, 0],
    color: '#42f59e',
    primaryColor: '#457b86',
    skinColor: '#e0b6a0',
    specialty: 'Physics, chemistry, radioactivity'
  }
];

// Main game scene component
const GameScene = ({ characters = FALLBACK_CHARACTERS, onCharacterSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const { camera } = useThree();
  
  // Handle character selection
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };
  
  // Reset camera on mount
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);
  
  return (
    <group>
      {/* Environment (sky, ground, trees, etc.) */}
      <Environment />
      
      {/* Historical characters as humanoid avatars */}
      {characters.map((character) => (
        <HumanoidCharacter 
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
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Select a historical figure to start a conversation
      </Text>
    </group>
  );
};

export default GameScene; 