import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { ThreeMFLoader } from 'three-stdlib';

interface ModelViewerProps {
  file: File;
  rotation?: [number, number, number];
}

export default function ModelViewer({ file, rotation = [0, 0, 0] }: ModelViewerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const positionOnPrintBed = (geom: THREE.BufferGeometry) => {
    geom.computeBoundingBox();
    const box = geom.boundingBox!;
    const center = box.getCenter(new THREE.Vector3());
    geom.translate(-center.x, -box.min.y, -center.z);
  };

  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let loadedGeometry: THREE.BufferGeometry | null = null;

        if (fileExtension === 'stl') {
          loadedGeometry = parseSTL(buffer);
        } else if (fileExtension === 'obj') {
          const text = new TextDecoder().decode(buffer);
          const loader = new OBJLoader();
          const obj = loader.parse(text);
          const mesh = obj.children.find(child => (child as THREE.Mesh).isMesh) as THREE.Mesh;
          if (mesh?.geometry) {
            loadedGeometry = mesh.geometry.clone();
          }
        } else if (fileExtension === '3mf') {
          const text = new TextDecoder().decode(buffer); // Decode binary to XML text
          const loader = new ThreeMFLoader();
          const object = loader.parse(text);

          let mesh: THREE.Mesh | undefined;

          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
              mesh = child as THREE.Mesh;
            }
          });

          if (mesh?.geometry) {
            loadedGeometry = mesh.geometry.clone();
          }
        } else {
          loadedGeometry = new THREE.BoxGeometry(20, 20, 20);
        }

        if (loadedGeometry) {
          loadedGeometry.computeBoundingBox();
          const box = loadedGeometry.boundingBox!;
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          const scale = Math.min(40 / maxDimension, 1);
          loadedGeometry.scale(scale, scale, scale);
          positionOnPrintBed(loadedGeometry);
          setGeometry(loadedGeometry);
        }
      } catch (error) {
        console.error('Error loading model:', error);
        const fallbackGeometry = new THREE.BoxGeometry(20, 20, 20);
        positionOnPrintBed(fallbackGeometry);
        setGeometry(fallbackGeometry);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, [file]);

  useEffect(() => {
    if (geometry && meshRef.current) {
      const tempGeometry = geometry.clone();
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
      tempGeometry.applyMatrix4(rotationMatrix);
      positionOnPrintBed(tempGeometry);
      meshRef.current.geometry = tempGeometry;
      meshRef.current.rotation.set(0, 0, 0);
    }
  }, [rotation, geometry]);

  const parseSTL = (buffer: ArrayBuffer): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const dataView = new DataView(buffer);
    const numTriangles = dataView.getUint32(80, true);
    const vertices: number[] = [];
    const normals: number[] = [];
    let offset = 84;

    for (let i = 0; i < numTriangles; i++) {
      const nx = dataView.getFloat32(offset, true);
      const ny = dataView.getFloat32(offset + 4, true);
      const nz = dataView.getFloat32(offset + 8, true);
      offset += 12;

      for (let j = 0; j < 3; j++) {
        vertices.push(dataView.getFloat32(offset, true));
        vertices.push(dataView.getFloat32(offset + 4, true));
        vertices.push(dataView.getFloat32(offset + 8, true));
        offset += 12;
        normals.push(nx, ny, nz);
      }

      offset += 2; // skip attribute byte count
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
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
