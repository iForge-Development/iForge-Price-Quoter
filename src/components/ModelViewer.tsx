import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  file: File;
}

export default function ModelViewer({ file }: ModelViewerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        let loadedGeometry: THREE.BufferGeometry | null = null;

        if (fileExtension === 'stl') {
          // For STL files, we'll need to manually parse
          // This is a simplified implementation - in production, use a proper STL loader
          loadedGeometry = parseSTL(buffer);
        } else if (fileExtension === 'obj') {
          // For OBJ files, we'll need to manually parse
          // This is a simplified implementation - in production, use a proper OBJ loader
          const text = new TextDecoder().decode(buffer);
          loadedGeometry = parseOBJ(text);
        } else if (fileExtension === '3mf') {
          // For 3MF files, create a placeholder for now
          // 3MF is a complex ZIP format that requires specialized parsing
          // This creates a recognizable placeholder that can be replaced with proper 3MF parsing
          loadedGeometry = parse3MF(buffer);
        } else {
          // For other formats, create a placeholder geometry
          loadedGeometry = new THREE.BoxGeometry(20, 20, 20);
        }

        if (loadedGeometry) {
          // Center and scale the geometry
          loadedGeometry.computeBoundingBox();
          const box = loadedGeometry.boundingBox!;
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          
          // Scale to fit within print bed (max 40 units to leave margin)
          const scale = Math.min(40 / maxDimension, 1);
          loadedGeometry.scale(scale, scale, scale);
          
          // Center on print bed
          loadedGeometry.computeBoundingBox();
          const newBox = loadedGeometry.boundingBox!;
          const center = newBox.getCenter(new THREE.Vector3());
          loadedGeometry.translate(-center.x, -newBox.min.y, -center.z);
          
          setGeometry(loadedGeometry);
        }
      } catch (error) {
        console.error('Error loading model:', error);
        // Fallback to a simple box
        const fallbackGeometry = new THREE.BoxGeometry(20, 20, 20);
        setGeometry(fallbackGeometry);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, [file]);

  // Simple STL parser (very basic implementation)
  const parseSTL = (buffer: ArrayBuffer): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const dataView = new DataView(buffer);
    
    // Skip header (80 bytes) and read number of triangles
    const numTriangles = dataView.getUint32(80, true);
    const vertices: number[] = [];
    const normals: number[] = [];
    
    let offset = 84;
    for (let i = 0; i < numTriangles; i++) {
      // Read normal (3 floats)
      const nx = dataView.getFloat32(offset, true);
      const ny = dataView.getFloat32(offset + 4, true);
      const nz = dataView.getFloat32(offset + 8, true);
      offset += 12;
      
      // Read 3 vertices (9 floats)
      for (let j = 0; j < 3; j++) {
        vertices.push(dataView.getFloat32(offset, true));
        vertices.push(dataView.getFloat32(offset + 4, true));
        vertices.push(dataView.getFloat32(offset + 8, true));
        offset += 12;
        
        // Use the face normal for all vertices
        normals.push(nx, ny, nz);
      }
      
      // Skip attribute byte count
      offset += 2;
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  };

  // Simple OBJ parser (very basic implementation)
  const parseOBJ = (text: string): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];
    const tempVertices: THREE.Vector3[] = [];
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      
      if (parts[0] === 'v') {
        // Vertex
        tempVertices.push(new THREE.Vector3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ));
      } else if (parts[0] === 'f') {
        // Face (simple triangulation for quads)
        const faceVertices = parts.slice(1).map(part => {
          const indices = part.split('/');
          return parseInt(indices[0]) - 1; // OBJ is 1-indexed
        });
        
        // Triangulate if quad
        if (faceVertices.length === 4) {
          // Split quad into two triangles
          const triangles = [
            [faceVertices[0], faceVertices[1], faceVertices[2]],
            [faceVertices[0], faceVertices[2], faceVertices[3]]
          ];
          
          for (const triangle of triangles) {
            for (const vertexIndex of triangle) {
              const vertex = tempVertices[vertexIndex];
              vertices.push(vertex.x, vertex.y, vertex.z);
            }
          }
        } else if (faceVertices.length === 3) {
          // Triangle
          for (const vertexIndex of faceVertices) {
            const vertex = tempVertices[vertexIndex];
            vertices.push(vertex.x, vertex.y, vertex.z);
          }
        }
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals(); // Compute normals automatically
    
    return geometry;
  };

  // Simple 3MF parser (placeholder implementation)
  const parse3MF = (buffer: ArrayBuffer): THREE.BufferGeometry => {
    // 3MF files are ZIP archives containing XML files
    // This is a placeholder implementation - in production, use a proper 3MF loader
    // For now, create a distinctive geometry to indicate 3MF file was recognized
    const geometry = new THREE.ConeGeometry(15, 30, 8);
    return geometry;
  };

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color="#ff6b35"
        metalness={0.1}
        roughness={0.3}
        envMapIntensity={1}
      />
    </mesh>
  );
}