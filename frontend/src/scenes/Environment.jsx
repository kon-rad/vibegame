import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Simple grass blade component for custom grass
const GrassField = ({ density = 1000, width = 100, height = 100 }) => {
  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < density; i++) {
      const x = (Math.random() - 0.5) * width;
      const z = (Math.random() - 0.5) * height;
      const rotation = Math.random() * Math.PI * 2;
      positions.push({ position: [x, 0, z], rotation, height: 0.2 + Math.random() * 0.3 });
    }
    return positions;
  }, [density, width, height]);

  return (
    <group>
      {positions.map((item, i) => (
        <mesh 
          key={i} 
          position={[item.position[0], item.height / 2, item.position[2]]} 
          rotation={[0, item.rotation, 0]}
          castShadow
        >
          <planeGeometry args={[0.1, item.height]} />
          <meshStandardMaterial 
            color="#4c9900" 
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Tree Component
const Tree = ({ position, scale = 1, type = 'pine' }) => {
  const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.5 * scale);
  
  // Different tree types
  const getTreeTop = () => {
    if (type === 'pine') {
      // Pine tree with multiple layers
      return (
        <>
          <mesh position={[0, 2.0 * scale, 0]} castShadow>
            <coneGeometry args={[1.2 * scale, 1.5 * scale, 8]} />
            <meshStandardMaterial color="#1b4d2a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.8 * scale, 0]} castShadow>
            <coneGeometry args={[0.9 * scale, 1.3 * scale, 8]} />
            <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.5 * scale, 0]} castShadow>
            <coneGeometry args={[0.6 * scale, 1.0 * scale, 8]} />
            <meshStandardMaterial color="#40916c" roughness={0.8} />
          </mesh>
        </>
      );
    } else {
      // Deciduous tree with round foliage
      return (
        <mesh position={[0, 2.7 * scale, 0]} castShadow>
          <sphereGeometry args={[1.2 * scale, 12, 12]} />
          <meshStandardMaterial color="#52b788" roughness={0.8} />
        </mesh>
      );
    }
  };
  
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.75 * scale, 0]} castShadow receiveShadow>
        <primitive object={trunkGeometry} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Tree top */}
      {getTreeTop()}
    </group>
  );
};

// Flower patch component
const FlowerPatch = ({ position, radius = 2, count = 20 }) => {
  const flowerPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      positions.push({
        x: position[0] + Math.cos(angle) * distance,
        z: position[2] + Math.sin(angle) * distance,
        color: ['#FF5E5B', '#FFED66', '#FFFFFF', '#74D5EA'][Math.floor(Math.random() * 4)],
        scale: 0.05 + Math.random() * 0.05
      });
    }
    return positions;
  }, [position, radius, count]);

  return (
    <group>
      {flowerPositions.map((flower, i) => (
        <group key={i} position={[flower.x, position[1], flower.z]}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[flower.scale, 8, 8]} />
            <meshStandardMaterial color={flower.color} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
            <meshStandardMaterial color="#4C9900" />
          </mesh>
        </group>
      ))}
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
    
    // Random tree type
    const type = Math.random() > 0.3 ? 'pine' : 'deciduous';
    
    positions.push({ position: [x, 0, z], scale, type });
  }
  return positions;
};

// Generate flower patch positions
const generateFlowerPositions = (count, radius) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    positions.push([
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    ]);
  }
  return positions;
};

// Main Environment Component
const Environment = () => {
  const treePositions = generateTreePositions(25, 40);
  const flowerPositions = generateFlowerPositions(15, 30);
  const cloudRefs = useRef([]);
  
  // Create ground texture
  const groundTexture = useMemo(() => {
    const grassColor = new THREE.Color("#5D9C59");
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: grassColor,
      roughness: 1,
      metalness: 0
    });
    return groundMaterial;
  }, []);
  
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
        sunPosition={[4, 5, -2]} 
        inclination={0.6} 
        azimuth={0.25}
        turbidity={10}
        rayleigh={0.5}
      />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#5D9C59"
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      {/* Custom grass */}
      <GrassField density={5000} width={100} height={100} />
      
      {/* Trees */}
      {treePositions.map((tree, i) => (
        <Tree 
          key={i} 
          position={tree.position} 
          scale={tree.scale}
          type={tree.type}
        />
      ))}
      
      {/* Flower patches */}
      {flowerPositions.map((position, i) => (
        <FlowerPatch key={i} position={position} />
      ))}
      
      {/* Clouds */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Cloud
          key={i}
          ref={(el) => (cloudRefs.current[i] = el)}
          position={[
            -30 + Math.random() * 60,
            15 + Math.random() * 10,
            -30 + Math.random() * 60
          ]}
          scale={[3 + Math.random() * 3, 1 + Math.random(), 1 + Math.random() * 0.5]}
          opacity={0.7}
          speed={0.1}
          segments={16}
          volume={0.1}
        />
      ))}
    </group>
  );
};

export default Environment; 