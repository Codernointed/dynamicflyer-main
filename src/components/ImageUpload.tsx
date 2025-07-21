
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onImageSelect: (file: File | null, preview: string | null) => void;
  error?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const isValid = img.width >= 800 && img.height >= 980;
        resolve(isValid);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const isValidImage = await validateImage(file);
    if (!isValidImage) {
      onImageSelect(null, null);
      alert("Image must be at least 800x980 pixels");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setImageFile(file);
    onImageSelect(file, previewUrl);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageSelect(null, null);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload image"
      />

      {!preview ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className={`relative border-2 border-dashed rounded-lg p-8 ${
            isDragging
              ? "border-primary bg-primary/5"
              : error
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-secondary/50"
          } transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div
              className={`p-4 rounded-full ${
                error ? "bg-destructive/10" : "bg-primary/10"
              }`}
            >
              <ImageIcon
                className={`h-8 w-8 ${
                  error ? "text-destructive" : "text-primary"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">
                {isDragging ? "Drop image here" : "Drag and drop your image here"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or WEBP (min. 800x980px)
              </p>
            </div>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover-scale"
            >
              <Upload className="h-4 w-4" />
              Browse Files
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-lg overflow-hidden"
        >
          <img
            src={preview}
            alt="Preview"
            className="w-full h-[300px] object-cover rounded-lg image-shadow"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white/90 text-foreground rounded-full hover:bg-white transition-colors"
              aria-label="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-destructive mt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default ImageUpload;
