import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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

// Player controller component - Modified to use forwardRef and accept onPlayerMove
const PlayerController = forwardRef(({ isActive, onPlayerMove }, ref) => {
  const playerRef = useRef();
  const { camera } = useThree();
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  const moveSpeed = 5; // Player movement speed (units per second)
  const cameraOffset = useRef(new THREE.Vector3(0, 3, 5)); // Initial camera offset

  // Expose player position via ref
  useImperativeHandle(ref, () => ({
    getPosition: () => playerRef.current ? playerRef.current.position.toArray() : [0, 0, 5]
  }));
  
  // Keyboard listeners
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setMovement(prev => ({ ...prev, forward: true })); break;
        case 'KeyS': case 'ArrowDown': setMovement(prev => ({ ...prev, backward: true })); break;
        case 'KeyA': case 'ArrowLeft': setMovement(prev => ({ ...prev, left: true })); break;
        case 'KeyD': case 'ArrowRight': setMovement(prev => ({ ...prev, right: true })); break;
        default: break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setMovement(prev => ({ ...prev, forward: false })); break;
        case 'KeyS': case 'ArrowDown': setMovement(prev => ({ ...prev, backward: false })); break;
        case 'KeyA': case 'ArrowLeft': setMovement(prev => ({ ...prev, left: false })); break;
        case 'KeyD': case 'ArrowRight': setMovement(prev => ({ ...prev, right: false })); break;
        default: break;
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
    
    const player = playerRef.current;
    let moved = false;
    
    const moveDirection = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(camera.up, cameraDirection).normalize();

    if (movement.forward) { moveDirection.add(cameraDirection); moved = true; }
    if (movement.backward) { moveDirection.sub(cameraDirection); moved = true; }
    if (movement.left) { moveDirection.add(cameraRight); moved = true; }
    if (movement.right) { moveDirection.sub(cameraRight); moved = true; }

    if (moved) {
      moveDirection.normalize();
      const moveVector = moveDirection.multiplyScalar(moveSpeed * delta);
      player.position.add(moveVector);

      // Rotate player model to face movement direction
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, 0.15);
      
      // Update parent component with new position
      if (onPlayerMove) {
        onPlayerMove(player.position.toArray());
      }
    }

    // Update camera position smoothly
    const targetCameraPosition = player.position.clone().add(cameraOffset.current);
    camera.position.lerp(targetCameraPosition, 0.1);
    camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);
  });
  
  return (
    <group ref={playerRef} position={[0, 0, 5]} className="player-controller">
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
      <mesh position={[0.1, 1.6, 0.2]}> {/* Slightly adjusted eye position */}
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.1, 1.6, 0.2]}> {/* Slightly adjusted eye position */}
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
});

// Main game scene component
const GameScene = ({ characters = FALLBACK_CHARACTERS, onCharacterSelect, isPlayerActive = false, onPlayerMove }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [nearbyCharacter, setNearbyCharacter] = useState(null);
  const { camera } = useThree();
  const playerControllerRef = useRef(null); // Ref for the PlayerController component
  
  // Handle character selection
  const handleCharacterClick = (character) => {
    console.log('Character clicked:', character.name);
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };
  
  // Camera setup effect
  useEffect(() => {
    if (camera) {
      if (!isPlayerActive) {
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
      } else {
        // Set initial camera relative to player start position
        camera.position.set(0, 3, 10); // Slightly adjusted start
        camera.lookAt(0, 0.5, 5);
      }
    }
  }, [camera, isPlayerActive]);
  
  // Find nearby characters (less critical now, could be used for UI hints)
  useFrame(() => {
    if (isPlayerActive && playerControllerRef.current) {
      const proximityRange = 3.5;
      let foundNearbyChar = null;
      const playerPosArray = playerControllerRef.current.getPosition();
      const playerPos = new THREE.Vector3().fromArray(playerPosArray);

      if (characters && characters.length > 0) {
        characters.forEach(character => {
          if (!character.position) return;
          const charPos = new THREE.Vector3().fromArray(character.position);
          const distance = playerPos.distanceTo(charPos);
          
          if (distance < proximityRange) {
            foundNearbyChar = character;
          }
        });
      }
      
      if (foundNearbyChar?.id !== (nearbyCharacter?.id || null)) {
        setNearbyCharacter(foundNearbyChar);
      }
    }
  });
  
  return (
    <group>
      <Environment />
      
      {/* Player character with ref and onPlayerMove callback */}
      {isPlayerActive && (
        <PlayerController 
          ref={playerControllerRef} // Attach ref
          isActive={isPlayerActive} 
          onPlayerMove={onPlayerMove} // Pass callback
        />
      )}
      
      {/* Historical characters */}
      {characters.map((character) => (
        <HumanoidCharacter 
          key={character.id}
          character={character}
          onClick={handleCharacterClick}
          isSelected={selectedCharacter && selectedCharacter.id === character.id}
          isNearby={nearbyCharacter && nearbyCharacter.id === character.id} // Still useful for highlight
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
      
      {/* Interaction hint using nearbyCharacter state */}
      {isPlayerActive && nearbyCharacter && (
        <Text
          position={[nearbyCharacter.position[0], nearbyCharacter.position[1] + 2.5, nearbyCharacter.position[2]]} // Position above the character
          color="#ffdd00"
          fontSize={0.3}
          maxWidth={5}
          textAlign="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
          billboard // Make text face the camera
        >
          Click on {nearbyCharacter.name} to talk
        </Text>
      )}
    </group>
  );
};

export default GameScene; 