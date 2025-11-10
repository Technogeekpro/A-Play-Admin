import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Link, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/storage";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  folder?: string;
  maxSizeInMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket = "images",
  folder = "events",
  maxSizeInMB = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  className,
  placeholder = "Upload an image or enter URL"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadFile(file, {
        bucket,
        folder,
        maxSizeInMB,
        allowedTypes: acceptedFileTypes
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onChange(result.url);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => acceptedFileTypes.includes(file.type));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      toast.error("Please drop a valid image file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
      toast.success("Image URL added successfully!");
    }
  };

  const handleRemove = () => {
    onChange("");
    if (onRemove) onRemove();
    setUrlInput("");
    toast.success("Image removed");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label>Cover Image</Label>
      
      {/* Current Image Preview */}
      {value && (
        <div className="relative group">
          <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileImage className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drop an image here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ')} (max {maxSizeInMB}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!value && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="gap-2"
            >
              <Link className="h-4 w-4" />
              Add URL
            </Button>
          </>
        )}
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Change Image
          </Button>
        )}
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
} 