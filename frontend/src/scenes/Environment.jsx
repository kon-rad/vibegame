import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Grass } from '@react-three/drei';
import * as THREE from 'three';

// Tree Component
const Tree = ({ position, scale = 1 }) => {
  const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.5 * scale);
  const leavesGeometry = new THREE.ConeGeometry(1 * scale, 2 * scale, 8);
  
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh
        position={[0, 0.75 * scale, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={trunkGeometry} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Leaves */}
      <mesh
        position={[0, 2.5 * scale, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={leavesGeometry} />
        <meshStandardMaterial color="#2E8B57" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Generate random positions for trees
const generateTreePositions = (count, radius) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    // Generate positions in a circle around the center
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius + radius * 0.5; // Keep away from center
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Random scale variation
    const scale = 0.8 + Math.random() * 0.4;
    
    positions.push({ position: [x, 0, z], scale });
  }
  return positions;
};

// Main Environment Component
const Environment = () => {
  const treePositions = generateTreePositions(15, 30);
  const cloudRefs = useRef([]);
  
  // Animate clouds
  useFrame((state, delta) => {
    cloudRefs.current.forEach((cloud, i) => {
      if (cloud) {
        cloud.position.x += delta * 0.2 * (i % 2 === 0 ? 1 : -0.7);
        
        // Reset cloud position when it moves too far
        if (cloud.position.x > 50) cloud.position.x = -50;
        if (cloud.position.x < -50) cloud.position.x = 50;
      }
    });
  });
  
  return (
    <group>
      {/* Sky with sun */}
      <Sky 
        distance={450000} 
        sunPosition={[0, 1, 0]} 
        inclination={0.6} 
        azimuth={0.25} 
      />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#5D9C59" />
      </mesh>
      
      {/* Grass patches */}
      <Grass
        map={null}
        blade={(props) => (
          <meshStandardMaterial
            {...props}
            color="#5D9C59"
            side={THREE.DoubleSide}
          />
        )}
        segments={10}
        blades={10000}
        position={[0, -0.48, 0]}
        scale={2}
      />
      
      {/* Trees */}
      {treePositions.map((tree, i) => (
        <Tree 
          key={i} 
          position={tree.position} 
          scale={tree.scale} 
        />
      ))}
      
      {/* Clouds */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Cloud
          key={i}
          ref={(el) => (cloudRefs.current[i] = el)}
          position={[
            -20 + Math.random() * 40,
            10 + Math.random() * 5,
            -20 + Math.random() * 40
          ]}
          scale={[3 + Math.random() * 2, 1 + Math.random(), 1]}
          opacity={0.5}
          speed={0.1}
          segments={10}
        />
      ))}
    </group>
  );
};

export default Environment; 