import React, { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
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

// Player controller component
const PlayerController = ({ isActive, onNearCharacter }) => {
  const playerRef = useRef();
  const { camera } = useThree();
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  // Set up keyboard listeners
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
          setMovement(prev => ({ ...prev, forward: true }));
          break;
        case 'KeyS':
          setMovement(prev => ({ ...prev, backward: true }));
          break;
        case 'KeyA':
          setMovement(prev => ({ ...prev, left: true }));
          break;
        case 'KeyD':
          setMovement(prev => ({ ...prev, right: true }));
          break;
        default:
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
          setMovement(prev => ({ ...prev, forward: false }));
          break;
        case 'KeyS':
          setMovement(prev => ({ ...prev, backward: false }));
          break;
        case 'KeyA':
          setMovement(prev => ({ ...prev, left: false }));
          break;
        case 'KeyD':
          setMovement(prev => ({ ...prev, right: false }));
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive]);
  
  // Handle movement and camera
  useFrame((state, delta) => {
    if (!isActive || !playerRef.current) return;
    
    const moveSpeed = 0.1;
    let moved = false;
    
    // Direction vector for movement
    const direction = new THREE.Vector3();
    
    // Get camera direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement on horizontal plane
    cameraDirection.normalize();
    
    // Calculate camera right vector
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();
    
    // Apply movement inputs
    if (movement.forward) {
      direction.add(cameraDirection);
      moved = true;
    }
    if (movement.backward) {
      direction.sub(cameraDirection);
      moved = true;
    }
    if (movement.left) {
      direction.add(cameraRight);
      moved = true;
    }
    if (movement.right) {
      direction.sub(cameraRight);
      moved = true;
    }
    
    // Move player if any keys are pressed
    if (moved) {
      direction.normalize();
      
      // Update position
      playerRef.current.position.x += direction.x * moveSpeed;
      playerRef.current.position.z += direction.z * moveSpeed;
      
      // Update player rotation to face movement direction
      if (direction.length() > 0) {
        const targetRotation = Math.atan2(direction.x, direction.z);
        playerRef.current.rotation.y = targetRotation;
      }
      
      // Update camera position to follow player
      camera.position.x = playerRef.current.position.x;
      camera.position.z = playerRef.current.position.z + 5;
      camera.lookAt(playerRef.current.position.x, 0.5, playerRef.current.position.z);
      
      // Check proximity to characters for interaction
      if (onNearCharacter) {
        // Find characters in proximity
        const proximityRange = 2.5; // units
        FALLBACK_CHARACTERS.forEach(character => {
          const distance = Math.sqrt(
            Math.pow(character.position[0] - playerRef.current.position.x, 2) +
            Math.pow(character.position[2] - playerRef.current.position.z, 2)
          );
          
          if (distance < proximityRange) {
            onNearCharacter(character);
          }
        });
      }
    }
  });
  
  return (
    <group ref={playerRef} position={[0, 0, 5]}>
      {/* Simple player model */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.3, 1, 16, 16]} />
        <meshStandardMaterial color="#4285f4" />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f5deb3" />
      </mesh>
      {/* Eyes for direction */}
      <mesh position={[0.1, 1.6, 0.18]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.1, 1.6, 0.18]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
};

// Main game scene component
const GameScene = ({ characters = FALLBACK_CHARACTERS, onCharacterSelect, isPlayerActive = false }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [nearbyCharacter, setNearbyCharacter] = useState(null);
  const { camera } = useThree();
  
  // Handle character selection
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };
  
  // Handle being near a character
  const handleNearCharacter = (character) => {
    setNearbyCharacter(character);
  };
  
  // Reset camera on mount and when player state changes
  useEffect(() => {
    if (camera) {
      if (!isPlayerActive) {
        // Default camera position when not playing
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
      } else {
        // Initial camera position for player controls
        camera.position.set(0, 2, 10);
        camera.lookAt(0, 0, 5);
      }
    }
  }, [camera, isPlayerActive]);
  
  // Find nearby characters on each frame when player is active
  useFrame(() => {
    if (isPlayerActive) {
      // Check if any character is nearby the player
      const playerPos = [0, 0, 5]; // Default player position
      const proximityRange = 2.5;
      
      let foundNearbyChar = null;
      characters.forEach(character => {
        if (!character.position) return;
        
        const distance = Math.sqrt(
          Math.pow(character.position[0] - playerPos[0], 2) +
          Math.pow(character.position[2] - playerPos[2], 2)
        );
        
        if (distance < proximityRange) {
          foundNearbyChar = character;
        }
      });
      
      if (foundNearbyChar !== nearbyCharacter) {
        setNearbyCharacter(foundNearbyChar);
      }
    }
  });
  
  return (
    <group>
      {/* Environment (sky, ground, trees, etc.) */}
      <Environment />
      
      {/* Player character (only visible when active) */}
      {isPlayerActive && (
        <PlayerController 
          isActive={isPlayerActive} 
          onNearCharacter={handleNearCharacter} 
        />
      )}
      
      {/* Historical characters as humanoid avatars */}
      {characters.map((character) => (
        <HumanoidCharacter 
          key={character.id}
          character={character}
          onClick={handleCharacterClick}
          isSelected={selectedCharacter && selectedCharacter.id === character.id}
          isNearby={nearbyCharacter && nearbyCharacter.id === character.id}
          isMoving={character.isMoving}
          isInteracting={character.isInteracting}
        />
      ))}
      
      {/* Instructions */}
      {!isPlayerActive && (
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
      )}
      
      {/* Interaction hint */}
      {isPlayerActive && nearbyCharacter && (
        <Text
          position={[0, 3, 0]}
          color="#ffdd00"
          fontSize={0.3}
          maxWidth={10}
          textAlign="center"
          outlineWidth={0.02}
          outlineColor="#000000"
          rotation={[0, Math.PI, 0]}
        >
          Click on {nearbyCharacter.name} to start a conversation
        </Text>
      )}
    </group>
  );
};

export default GameScene; 