import React from 'react';
import * as THREE from 'three';

export default function PrintBed() {
  // Create grid geometry for the print bed
  const createGridGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const size = 128; // 256mm bed, scaled down
    const divisions = 16;
    const step = size / divisions;

    // Create grid lines
    for (let i = 0; i <= divisions; i++) {
      const pos = (i * step) - size / 2;
      
      // Horizontal lines
      vertices.push(-size / 2, 0, pos);
      vertices.push(size / 2, 0, pos);
      
      // Vertical lines
      vertices.push(pos, 0, -size / 2);
      vertices.push(pos, 0, size / 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  };

  const gridGeometry = createGridGeometry();

  return (
    <group>
      {/* Print bed surface */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[128, 2, 128]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          metalness={0.1} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Print bed grid */}
      <lineSegments position={[0, 0.1, 0]} geometry={gridGeometry}>
        <lineBasicMaterial color="#e0e0e0" transparent opacity={0.5} />
      </lineSegments>
      
      {/* Orange accent border */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[64, 66, 32]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Bambu Lab logo area (simplified) */}
      <mesh position={[-50, 0.2, -50]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          transparent 
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}