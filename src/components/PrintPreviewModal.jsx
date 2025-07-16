import React, { Suspense, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Clock, Weight, DollarSign, Printer, Download, X } from 'lucide-react';
import ModelViewer from './ModelViewer';
import PrintBed from './PrintBed';

export default function PrintPreviewModal({ isOpen, onClose, file }) {
  const [estimates, setEstimates] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Simulate backend calculation
  useEffect(() => {
    if (file && isOpen) {
      setIsCalculating(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // Mock calculations based on file size (in real app, this would come from backend)
        const fileSizeMB = file.size / (1024 * 1024);
        const baseTime = Math.max(30, fileSizeMB * 45); // minutes
        const hours = Math.floor(baseTime / 60);
        const minutes = Math.round(baseTime % 60);
        
        setEstimates({
          printTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          filamentUsed: Math.round(fileSizeMB * 15 + 20), // grams
          costKES: Math.round((fileSizeMB * 15 + 20) * 2.5), // KES per gram
        });
        setIsCalculating(false);
      }, 2000);
    }
  }, [file, isOpen]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Printer className="h-6 w-6 text-primary" />
              3D Print Preview
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {file && (
            <p className="text-muted-foreground">
              {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* 3D Preview */}
          <div className="flex-1 relative bg-gradient-to-br from-background to-accent/20">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 50, 100]} fov={50} />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2}
                target={[0, 0, 0]}
              />
              
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <directionalLight position={[-10, 10, -5]} intensity={0.5} />
              
              <Suspense fallback={null}>
                <Environment preset="studio" />
                <PrintBed />
                {file && <ModelViewer file={file} />}
              </Suspense>
            </Canvas>
            
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <Badge variant="secondary" className="text-xs">
                256×256×256mm Print Bed
              </Badge>
            </div>
          </div>

          {/* Estimates Panel */}
          <div className="w-full lg:w-80 p-6 border-l bg-card">
            <h3 className="text-lg font-semibold mb-4">Print Estimates</h3>
            
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
                      <Clock className="h-4 w-4 text-primary" />
                      Print Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold text-primary">{estimates.printTime}</p>
                  </CardContent>
                </Card>

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

                <div className="pt-4 space-y-2">
                  <Button className="w-full" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Start Print Job
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save for Later
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground p-4 bg-accent/50 rounded-lg">
                  <p className="font-medium mb-1">Print Settings:</p>
                  <ul className="space-y-1">
                    <li>• Layer Height: 0.2mm</li>
                    <li>• Infill: 20%</li>
                    <li>• Support: Auto-generated</li>
                    <li>• Material: PLA</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}