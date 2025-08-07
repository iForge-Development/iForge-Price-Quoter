import React, { Suspense, useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, Environment
} from '@react-three/drei';
import {
  Clock, Weight, DollarSign, Printer, RotateCw, RotateCcw, FlipHorizontal
} from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import ModelViewer from './ModelViewer';
import PrintBed from './PrintBed';

interface PrintEstimates {
  printTime: string;
  filamentUsed: number;
  costKES: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
}

const filamentTypes = {
  PETG: 1.0,
  PLA: 1.2,
};

export default function PrintPreviewModal({ isOpen, onClose, file }: PrintPreviewModalProps) {
  const [estimates, setEstimates] = useState<PrintEstimates | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [modelRotation, setModelRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [filament, setFilament] = useState<keyof typeof filamentTypes>("PLA");

  useEffect(() => {
    if (!file || !isOpen) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return;

    setIsCalculating(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      let geometry: THREE.BufferGeometry | null = null;

      try {
        if (extension === 'stl') {
          const loader = new STLLoader();
          geometry = loader.parse(arrayBuffer);
        } else if (extension === 'obj') {
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(arrayBuffer);
          const objLoader = new OBJLoader();
          const obj = objLoader.parse(text);
          const mesh = obj.children.find((child) => (child as THREE.Mesh).isMesh) as THREE.Mesh;
          if (mesh && mesh.geometry) {
            geometry = mesh.geometry as THREE.BufferGeometry;
          } else {
            throw new Error("OBJ file does not contain valid mesh geometry.");
          }
        } else {
          throw new Error("Unsupported file type.");
        }

        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const bbox = geometry.boundingBox!;
        const width = +(bbox.max.x - bbox.min.x).toFixed(1);
        const height = +(bbox.max.y - bbox.min.y).toFixed(1);
        const depth = +(bbox.max.z - bbox.min.z).toFixed(1);

        const volume_mm3 = computeMeshVolume(geometry);
        const density = 1.24;
        const actualDensity = density * filamentTypes[filament];
        const filamentUsed = +(volume_mm3 / 1000 * actualDensity).toFixed(1);
        const printSpeedFactor = 15;
        const printTimeMin = Math.max(6, volume_mm3 / printSpeedFactor);
        const printTime = printTimeMin < 60
          ? `${Math.round(printTimeMin)}m`
          : `${Math.floor(printTimeMin / 60)}h ${Math.round(printTimeMin % 60)}m`;
        const costKES = Math.round((filamentUsed * .25) + (printTimeMin * .3));

        setEstimates({
          printTime,
          filamentUsed,
          costKES,
          dimensions: { width, height, depth },
        });
      } catch (err) {
        console.error("Model processing error:", err);
      } finally {
        setIsCalculating(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [file, isOpen, filament]);

  const computeMeshVolume = (geometry: THREE.BufferGeometry): number => {
    const posAttr = geometry.attributes.position;
    let volume = 0;

    for (let i = 0; i < posAttr.count; i += 3) {
      const p1 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const p2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const p3 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);

      volume += p1.dot(p2.cross(p3)) / 6.0;
    }

    return Math.abs(volume);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 🔽 Made modal smaller */}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden p-0 mt-16" >

        <DialogHeader className="p-6 pb-0">
         
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Printer className="h-6 w-6 text-primary" />
            3D Print Preview
          </DialogTitle>
          {file && (
            <p className="text-muted-foreground">
              {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </DialogHeader>

        {/* 🔽 Reduced height from 600px to 500px */}
        <div className="flex flex-col lg:flex-row h-[500px]">
          <div className="flex-1 relative bg-gradient-to-br from-background to-accent/20 min-h-[300px] sm:min-h-[400px] lg:h-[500px]">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 50, 100]} fov={50} />
              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2}
                target={[0, 0, 0]}
              />
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <directionalLight position={[-10, 10, -5]} intensity={0.5} />
              <Suspense fallback={null}>
                <Environment preset="studio" />
                <PrintBed />
                {file && <ModelViewer file={file} rotation={modelRotation} />}
              </Suspense>
            </Canvas>

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <Badge variant="secondary" className="text-xs">
                256×256×256mm Print Bed
              </Badge>
            </div>

            {file && (
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() =>
                    setModelRotation([modelRotation[0] + Math.PI / 2, modelRotation[1], modelRotation[2]])
                  } className="text-white hover:bg-white/20">
                    <RotateCw className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() =>
                    setModelRotation([modelRotation[0], modelRotation[1] + Math.PI / 2, modelRotation[2]])
                  } className="text-white hover:bg-white/20">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() =>
                    setModelRotation([modelRotation[0], modelRotation[1], modelRotation[2] + Math.PI / 2])
                  } className="text-white hover:bg-white/20">
                    <FlipHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 p-6 border-l bg-card max-h-[500px] overflow-y-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="mb-2 text-sm text-muted-foreground hover:text-primary w-fit"
          >
            ←  Back
          </Button>
            <h3 className="text-lg font-semibold mb-4">Print Estimates</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Filament Type
              </label>
              <select
                className="w-full border border-border bg-background p-2 rounded-md text-sm"
                value={filament}
                onChange={(e) => setFilament(e.target.value as keyof typeof filamentTypes)}
              >
                {Object.keys(filamentTypes).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {isCalculating ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-6 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Calculating estimates...</p>
                </div>
              </div>
            ) : estimates ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Weight className="h-4 w-4 text-primary" />
                      Filament Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold text-primary">{estimates.filamentUsed}g</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Estimated Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(estimates.costKES)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                      <Printer className="h-4 w-4 text-primary" />
                      Model Dimensions
                    <CardTitle className="text-sm flex items-center gap-2">
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-base font-semibold text-primary">
                    </p>
                  </CardContent>
                      {estimates.dimensions.width} × {estimates.dimensions.height} × {estimates.dimensions.depth} mm
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
