import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Image, Check, AlertCircle } from "lucide-react";
import { uploadFile } from "@/services/storageService";
import { toast } from "sonner";

interface FileUploaderProps {
  issueId?: string;
  onFileUploaded?: (url: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  issueId,
  onFileUploaded,
  maxFiles = 5,
  acceptedFileTypes = "image/png,image/jpeg,image/gif,application/pdf"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if too many files are being uploaded
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Upload the file
        const url = await uploadFile(file, issueId);
        
        if (url) {
          setUploadedFiles(prev => [...prev, url]);
          
          // Call the callback if provided
          if (onFileUploaded) {
            onFileUploaded(url);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('An error occurred while uploading files');
    } finally {
      setIsUploading(false);
      
      // Clear the input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const getFileIcon = (url: string) => {
    if (url.endsWith('.pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleUploadClick}
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        >
          {isUploading ? (
            <>
              <div className="animate-spin mr-2">
                <Upload className="h-4 w-4" />
              </div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          multiple={maxFiles > 1}
          disabled={isUploading}
        />
        
        <div className="text-xs text-muted-foreground">
          {uploadedFiles.length} of {maxFiles} files
        </div>
      </div>
      
      {uploadedFiles.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {uploadedFiles.map((url, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-primary-foreground/20 rounded text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(url)}
                    <span className="truncate max-w-[200px]">{url.split('/').pop()}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      <div className="text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 inline mr-1" />
        Supported formats: PNG, JPEG, GIF, PDF. Max file size: 10MB.
      </div>
    </div>
  );
};

export default FileUploader; 