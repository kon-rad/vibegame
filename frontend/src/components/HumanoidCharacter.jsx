import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// Basic humanoid character representation
const HumanoidCharacter = ({ character, onClick, isSelected, isNearby, isMoving = false, isInteracting = false }) => {
  const { camera } = useThree();
  const group = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const rightArmRef = useRef();
  const leftArmRef = useRef();
  
  // State for animation and interaction
  const [hovered, setHovered] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [bobOffset, setBobOffset] = useState(0);
  
  // Colors
  const skinColor = new THREE.Color(character.skinColor || '#e0ac69');
  const clothesColor = new THREE.Color(character.primaryColor || character.color || '#4287f5');
  const highlightColor = new THREE.Color(clothesColor).lerp(new THREE.Color('white'), 0.3);
  
  // Update animation time
  useFrame((state, delta) => {
    setAnimationTime(prev => prev + delta);
    
    // Basic idle animation - subtle bobbing up and down
    if (group.current) {
      const newBobOffset = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      setBobOffset(newBobOffset);
      group.current.position.y = character.position[1] + newBobOffset;
    }
    
    // Head movement - looking around slightly
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      
      // If nearby, make the character look at the player
      if (isNearby || isInteracting) {
        const lookAtPlayer = new THREE.Vector3(0, 1.5, 5); // Approximate player position
        headRef.current.lookAt(lookAtPlayer);
        // Limit rotation to avoid unnatural angles
        headRef.current.rotation.x = Math.max(-0.3, Math.min(0.3, headRef.current.rotation.x));
        headRef.current.rotation.y = Math.max(-0.8, Math.min(0.8, headRef.current.rotation.y));
      }
    }
    
    // Arm movement for selected character or when interacting (talking animation)
    if ((isSelected || isInteracting) && rightArmRef.current && leftArmRef.current) {
      // Right arm gestures
      rightArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.2 - 0.3;
      rightArmRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 1.5) * 0.1;
      
      // Left arm more subtle movement
      leftArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.3) * 0.1 - 0.2;
    } else if (rightArmRef.current && leftArmRef.current) {
      // Reset to idle position
      rightArmRef.current.rotation.x = -0.2;
      rightArmRef.current.rotation.z = 0.1;
      leftArmRef.current.rotation.x = -0.2;
    }
    
    // Special nearby animation - wave arm when nearby but not interacting
    if (isNearby && !isSelected && !isInteracting && rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3) * 0.5 - 0.5;
      rightArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
    
    // Walking animation when moving
    if (isMoving && rightArmRef.current && leftArmRef.current) {
      const walkSpeed = 3;
      rightArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * walkSpeed) * 0.4;
      leftArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * walkSpeed + Math.PI) * 0.4;
    }
  });
  
  // Apply selection effects
  useEffect(() => {
    if (bodyRef.current) {
      if (isSelected) {
        bodyRef.current.material.color.set(highlightColor);
      } else {
        bodyRef.current.material.color.set(clothesColor);
      }
    }
  }, [isSelected, clothesColor, highlightColor]);
  
  // Determine if character can be interacted with (nearby or selected)
  const isInteractable = isNearby || isSelected;
  
  return (
    <group 
      ref={group} 
      position={[character.position[0], character.position[1], character.position[2]]}
      onClick={() => isInteractable && onClick(character)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      rotation={[0, character.rotation?.[1] || 0, 0]}
    >
      {/* Status indicators */}
      {isMoving && (
        <Text
          position={[0, 2.3, 0]}
          color="#7af7ff"
          fontSize={0.12}
          maxWidth={2}
          textAlign="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
          lookAt={camera.position}
        >
          Moving...
        </Text>
      )}
      
      {isInteracting && !isSelected && (
        <Text
          position={[0, 2.3, 0]}
          color="#ffaa00"
          fontSize={0.12}
          maxWidth={2}
          textAlign="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
          lookAt={camera.position}
        >
          Thinking...
        </Text>
      )}
      
      {/* Body */}
      <mesh ref={bodyRef} castShadow position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color={clothesColor} roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh ref={headRef} castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      
      {/* Eyes */}
      <group position={[0, 1.65, 0.15]}>
        <mesh position={[-0.08, 0.02, 0.1]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0.08, 0.02, 0.1]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <mesh ref={rightArmRef} castShadow position={[-0.45, 0.9, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.08, 0.7, 4, 8]} />
        <meshStandardMaterial color={clothesColor} roughness={0.8} />
      </mesh>
      
      {/* Left Arm */}
      <mesh ref={leftArmRef} castShadow position={[0.45, 0.9, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.08, 0.7, 4, 8]} />
        <meshStandardMaterial color={clothesColor} roughness={0.8} />
      </mesh>
      
      {/* Legs */}
      <mesh castShadow position={[-0.15, 0.25, 0]}>
        <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
        <meshStandardMaterial color={'#4a4a4a'} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.15, 0.25, 0]}>
        <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
        <meshStandardMaterial color={'#4a4a4a'} roughness={0.8} />
      </mesh>
      
      {/* Character accessory based on historical figure 
        Socrates - scroll, Da Vinci - notebook, Curie - flask */}
      {character.name === "Socrates" && (
        <mesh castShadow position={[-0.5, 0.8, 0.2]} rotation={[0.5, 0, -0.3]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          <meshStandardMaterial color="#d4c9b9" roughness={0.6} />
        </mesh>
      )}
      
      {character.name === "Leonardo da Vinci" && (
        <mesh castShadow position={[-0.5, 0.8, 0.2]} rotation={[0.2, 0.1, -0.3]}>
          <boxGeometry args={[0.2, 0.25, 0.02]} />
          <meshStandardMaterial color="#5c3b20" roughness={0.6} />
        </mesh>
      )}
      
      {character.name === "Marie Curie" && (
        <mesh castShadow position={[-0.5, 0.8, 0.2]} rotation={[0.2, 0, -0.3]}>
          <cylinderGeometry args={[0.06, 0.08, 0.2, 16]} />
          <meshStandardMaterial color="#a0e0f0" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Character name label */}
      <Text
        position={[0, 2.1, 0]}
        color={isNearby ? "#ffdd00" : "white"}
        fontSize={0.2}
        maxWidth={2}
        textAlign="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
        lookAt={camera.position}
      >
        {character.name}
      </Text>
      
      {/* Era information shown on hover */}
      {(hovered || isSelected || isNearby) && (
        <Text
          position={[0, 1.9, 0]}
          color="#aaaaff"
          fontSize={0.12}
          maxWidth={2}
          textAlign="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
          lookAt={camera.position}
        >
          {character.era}
        </Text>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color="gold" />
        </mesh>
      )}
      
      {/* Nearby indicator - shows when the player is close enough to interact */}
      {isNearby && !isSelected && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color="#ffdd00" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Interaction hint when nearby */}
      {isNearby && !isSelected && (
        <Text
          position={[0, 2.3, 0]}
          color="#ffffff"
          fontSize={0.12}
          maxWidth={2}
          textAlign="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
          lookAt={camera.position}
        >
          Click to talk
        </Text>
      )}
    </group>
  );
};

export default HumanoidCharacter; 