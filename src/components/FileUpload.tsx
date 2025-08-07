import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const ACCEPTED_FILE_TYPES = {
  'model/stl': ['.stl'],
  'application/x-wavefront-obj': ['.obj'],
};

export default function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid .stl, or .obj file');
      return;
    }

    if (acceptedFiles.length > 0) {
      setError(null);
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const dropzoneClassName = cn(
    "relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer",
    "hover:border-primary hover:bg-gradient-glow",
    isDragActive && "border-primary bg-gradient-glow scale-[1.02]",
    isDragAccept && "border-primary bg-primary/5",
    isDragReject && "border-destructive bg-destructive/5",
    isLoading && "pointer-events-none opacity-60"
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div {...getRootProps()} className={dropzoneClassName}>
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg font-medium text-muted-foreground">
                Processing your file...
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-primary rounded-full shadow-glow">
                  {isDragActive ? (
                    <FileUp className="h-8 w-8 text-primary-foreground animate-bounce-light" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {isDragActive ? 'Drop your file here' : 'Upload 3D Model'}
                </h3>
                <p className="text-muted-foreground">
                  Drag & drop your .stl, or .obj file here, or click to browse
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-accent rounded-md">.STL</span>
                <span className="px-2 py-1 bg-accent rounded-md">.OBJ</span>
              </div>

              <Button variant="outline" size="lg" className="mx-auto">
                Choose File
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Maximum file size: 100MB
      </div>
    </div>
  );
}