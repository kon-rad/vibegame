import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SPEED = 5;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

const PlayerCharacter = ({ isActive = false }) => {
  const { camera } = useThree();
  const playerRef = useRef();
  
  // Store movement keys state
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  
  // Setup key controls
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
          setMovement((prev) => ({ ...prev, forward: true }));
          break;
        case 'KeyS':
          setMovement((prev) => ({ ...prev, backward: true }));
          break;
        case 'KeyA':
          setMovement((prev) => ({ ...prev, left: true }));
          break;
        case 'KeyD':
          setMovement((prev) => ({ ...prev, right: true }));
          break;
        case 'Space':
          setMovement((prev) => ({ ...prev, jump: true }));
          break;
        default:
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
          setMovement((prev) => ({ ...prev, forward: false }));
          break;
        case 'KeyS':
          setMovement((prev) => ({ ...prev, backward: false }));
          break;
        case 'KeyA':
          setMovement((prev) => ({ ...prev, left: false }));
          break;
        case 'KeyD':
          setMovement((prev) => ({ ...prev, right: false }));
          break;
        case 'Space':
          setMovement((prev) => ({ ...prev, jump: false }));
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive]);
  
  // Update player movement in each frame
  useFrame((state, delta) => {
    if (!isActive || !playerRef.current) return;
    
    // Calculate movement direction based on camera orientation
    frontVector.set(0, 0, movement.backward ? 1 : movement.forward ? -1 : 0);
    sideVector.set(movement.left ? -1 : movement.right ? 1 : 0, 0, 0);
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * delta);
    
    // Calculate player rotation to match movement direction
    if (direction.length() > 0) {
      // Get the camera's forward direction projected onto the xz plane
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Create a rotation matrix from the movement direction
      const playerQuaternion = playerRef.current.quaternion;
      const targetQuaternion = new THREE.Quaternion();
      
      // Calculate the target rotation based on movement direction
      if (movement.forward) {
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cameraDirection);
      } else if (movement.backward) {
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cameraDirection.clone().negate());
      } else if (movement.left) {
        const leftVector = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection);
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), leftVector);
      } else if (movement.right) {
        const rightVector = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rightVector);
      }
      
      // Smoothly interpolate current rotation to target rotation
      playerQuaternion.slerp(targetQuaternion, 0.1);
    }
    
    // Apply movement to player position
    playerRef.current.position.x -= direction.x;
    playerRef.current.position.z -= direction.z;
    
    // Keep y position constant (on the ground)
    playerRef.current.position.y = 0;
    
    // Update camera to follow player
    const idealOffset = new THREE.Vector3(0, 4, 8);
    idealOffset.applyQuaternion(playerRef.current.quaternion);
    idealOffset.add(playerRef.current.position);
    
    state.camera.position.lerp(idealOffset, 0.05);
    state.camera.lookAt(playerRef.current.position);
  });
  
  return (
    <group ref={playerRef} position={[0, 0, 5]}>
      {/* Simple character body */}
      <mesh castShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#2a6dd5" />
      </mesh>
      
      {/* Character head */}
      <mesh castShadow position={[0, 2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#f0d0b0" />
      </mesh>
      
      {/* Eyes */}
      <group position={[0, 2, 0.35]}>
        <mesh position={[-0.15, 0.05, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0.15, 0.05, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
    </group>
  );
};

export default PlayerCharacter; 