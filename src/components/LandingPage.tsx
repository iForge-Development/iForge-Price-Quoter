import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Zap, Shield, Clock } from 'lucide-react';
import FileUpload from './FileUpload';
import PrintPreviewModal from './PrintPreviewModal';
import iForgeLogo from "@/assets/iForge-logo2.png"; // adjust path as needed


export default function LandingPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    // Simulate upload processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUploadedFile(file);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Preview",
      description: "See your 3D model rendered on our virtual print bed immediately"
    },
    {
      icon: Clock,
      title: "Smart Estimates",
      description: "Get accurate print time, filament usage, and cost calculations"
    },
    {
      icon: Shield,
      title: "Secure Upload",
      description: "Your files are processed securely and never stored permanently"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          
          {/*<div className="flex items-center gap-2">
          <div className="">
            <img
              src={iForgeLogo}
              alt="iForge Logo"
              className="h-12 w-24 object-contain"
            />
          </div>
          </div>
  */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              Powered by Bambu Lab
            </Badge>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Preview Your 3D Print
            <br />
            <span className="text-primary">Before You Print</span>
          </h2>

          
        </div>

        {/* Upload Section */}
        <div className="mb-20">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isUploading} />
        </div>

        
        {/* Features Section */}
        {/*
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose PrintPreview?</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-card border rounded-xl hover:shadow-primary transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-glow group-hover:animate-pulse-glow">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
            */}

        {/* 
        Stats Section 
        <div className="bg-gradient-glow rounded-2xl p-8 border">
          <div className="flex justify-center text-center gap-x-32">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">256×256mm</div>
              <div className="text-muted-foreground">Print Bed Size</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">&lt; 3s</div>
              <div className="text-muted-foreground">Preview Generation</div>
            </div>
          </div>
        </div>
         */}
      </main>
       

      

      {/* Modal */}
      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={uploadedFile}
      />
    </div>
  );
}