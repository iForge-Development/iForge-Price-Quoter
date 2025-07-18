import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import JSZip from 'jszip';

interface ModelViewerProps {
  file: File;
  rotation?: [number, number, number];
}

export default function ModelViewer({ file, rotation = [0, 0, 0] }: ModelViewerProps) {
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
          // For 3MF files, extract and parse the model data
          loadedGeometry = await parse3MF(buffer);
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

  // 3MF parser (basic implementation)
  const parse3MF = async (buffer: ArrayBuffer): Promise<THREE.BufferGeometry> => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    try {
      const zip = await JSZip.loadAsync(buffer);
      const modelFile = zip.file('3D/3dmodel.model');
      
      if (!modelFile) {
        throw new Error('No 3D model found in 3MF file');
      }
      
      const xmlText = await modelFile.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Extract vertices
      const vertexNodes = xmlDoc.getElementsByTagName('vertex');
      const tempVertices: THREE.Vector3[] = [];
      
      for (let i = 0; i < vertexNodes.length; i++) {
        const vertex = vertexNodes[i];
        const x = parseFloat(vertex.getAttribute('x') || '0');
        const y = parseFloat(vertex.getAttribute('y') || '0');
        const z = parseFloat(vertex.getAttribute('z') || '0');
        tempVertices.push(new THREE.Vector3(x, y, z));
      }
      
      // Extract triangles
      const triangleNodes = xmlDoc.getElementsByTagName('triangle');
      
      for (let i = 0; i < triangleNodes.length; i++) {
        const triangle = triangleNodes[i];
        const v1 = parseInt(triangle.getAttribute('v1') || '0');
        const v2 = parseInt(triangle.getAttribute('v2') || '0');
        const v3 = parseInt(triangle.getAttribute('v3') || '0');
        
        if (tempVertices[v1] && tempVertices[v2] && tempVertices[v3]) {
          vertices.push(
            tempVertices[v1].x, tempVertices[v1].y, tempVertices[v1].z,
            tempVertices[v2].x, tempVertices[v2].y, tempVertices[v2].z,
            tempVertices[v3].x, tempVertices[v3].y, tempVertices[v3].z
          );
        }
      }
      
      if (vertices.length === 0) {
        throw new Error('No triangles found in 3MF file');
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      
      return geometry;
    } catch (error) {
      console.error('Error parsing 3MF file:', error);
      // Return a placeholder box on error
      return new THREE.BoxGeometry(20, 20, 20);
    }
  };

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial
        color="#ff6b35"
        metalness={0.1}
        roughness={0.3}
        envMapIntensity={1}
      />
    </mesh>
  );
}