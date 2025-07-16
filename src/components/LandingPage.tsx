import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Zap, Shield, Clock } from 'lucide-react';
import FileUpload from './FileUpload';
import PrintPreviewModal from './PrintPreviewModal';

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
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
              <Printer className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PrintPreview</h1>
          </div>
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
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Professional 3D Printing Preview</span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Preview Your 3D Print
            <br />
            <span className="text-primary">Before You Print</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Upload your STL, 3MF, or OBJ files and get instant preview with accurate print estimates. 
            See exactly how your model will look on a Bambu Lab-style 256×256×256mm print bed.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Badge variant="outline" className="text-lg px-4 py-2">
              STL Files
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              3MF Files
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              OBJ Files
            </Badge>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-20">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isUploading} />
        </div>

        {/* Features Section */}
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

        {/* Stats Section */}
        <div className="bg-gradient-glow rounded-2xl p-8 border">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">256×256mm</div>
              <div className="text-muted-foreground">Print Bed Size</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">&lt; 3s</div>
              <div className="text-muted-foreground">Preview Generation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">KES</div>
              <div className="text-muted-foreground">Local Currency Support</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 PrintPreview. Professional 3D printing preview tool.</p>
          <p className="text-sm mt-2">
            Designed for the Kenyan 3D printing community with Bambu Lab aesthetics.
          </p>
        </div>
      </footer>

      {/* Modal */}
      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={uploadedFile}
      />
    </div>
  );
}