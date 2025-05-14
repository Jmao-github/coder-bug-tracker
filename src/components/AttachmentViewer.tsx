import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Image, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentViewerProps {
  attachments: string[];
  showTitle?: boolean;
}

/**
 * Component to display a list of attachments with preview functionality
 */
const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ 
  attachments,
  showTitle = true
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  if (!attachments || attachments.length === 0) {
    return null;
  }
  
  const isImage = (url: string): boolean => {
    // Check by extension
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return true;
    }
    
    // Check Circle.so URLs that might be images (without extensions)
    if (url.includes('circle.so/rails/active_storage') || 
        url.includes('app.circle.so/rails/active_storage') ||
        url.includes('representations') ||
        url.includes('avatar')) {
      return true;
    }
    
    // Check for other image hosting services
    if (url.includes('unsplash.com') ||
        url.includes('imgur.com') ||
        url.includes('cloudinary.com')) {
      return true;
    }
    
    return false;
  };
  
  const isPdf = (url: string): boolean => {
    return /\.pdf$/i.test(url);
  };
  
  const getFileName = (url: string): string => {
    // Try to extract a meaningful filename from the URL
    
    // Check for Circle.so avatars/images
    if (url.includes('circle.so') && url.includes('avatar')) {
      return 'user-avatar.png';
    }
    
    // General URL parsing
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // If the last part has a file extension, use it
      if (lastPart.includes('.')) {
        return lastPart;
      }
      
      // Otherwise create a filename based on the path
      return lastPart || 'attachment';
    } catch (e) {
      // If URL parsing fails, just use the last part of the path
      const parts = url.split('/');
      return parts[parts.length - 1] || 'attachment';
    }
  };
  
  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };
  
  const closePreview = () => {
    setPreviewUrl(null);
  };
  
  const getFileIcon = (url: string) => {
    if (isPdf(url)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (isImage(url)) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-2">
      {showTitle && attachments.length > 0 && (
        <h3 className="text-sm font-medium">Attachments ({attachments.length})</h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        {attachments.map((url, index) => (
          <div 
            key={index} 
            className="border rounded-md p-2 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {getFileIcon(url)}
            <span className="text-xs truncate max-w-32">{getFileName(url)}</span>
            <div className="flex gap-1">
              {isImage(url) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => handlePreview(url)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                asChild
              >
                <a href={url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex justify-center">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-[70vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjJDMTcuNTIyOCAyMiAyMiAxNy41MjI4IDIyIDEyQzIyIDYuNDc3MTUgMTcuNTIyOCAyIDEyIDJDNi40NzcxNSAyIDIgNi40NzcxNSAyIDEyQzIgMTcuNTIyOCA2LjQ3NzE1IDIyIDEyIDIyWiIgc3Ryb2tlPSIjZmYzMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xNC41IDl2MCBDMTQuNSA3Ljg5NTQzIDEzLjYwNDYgNyAxMi41IDdIOS41QzguMzk1NDMgNyA3LjUgNy44OTU0MyA3LjUgOXYwQzcuNSAxMC4xMDQ2IDguMzk1NDMgMTEgOS41IDExSDEyLjVDMTMuNjA0NiAxMSAxNC41IDExLjg5NTQgMTQuNSAxM3YwQzE0LjUgMTQuMTA0NiAxMy42MDQ2IDE1IDEyLjUgMTVIOS41QzguMzk1NDMgMTUgNy41IDE0LjEwNDYgNy41IDEzdjAiIHN0cm9rZT0iI2ZmMzMzMyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMiA1LjVWN00xMiAxNy4wMVYxOSIgc3Ryb2tlPSIjZmYzMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                  target.alt = 'Error loading image';
                  target.className = 'max-h-[20vh] object-contain p-4';
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttachmentViewer; 