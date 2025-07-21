import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from '@/lib/imageUtils';

interface CropModalProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatio?: number;
}

const CropModal: React.FC<CropModalProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 3/4
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!imageFile || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(
        URL.createObjectURL(imageFile),
        croppedAreaPixels
      );
      
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    }
  }, [imageFile, croppedAreaPixels, onCropComplete, onClose]);

  if (!imageFile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-grow my-4 h-full">
          <Cropper
            image={URL.createObjectURL(imageFile)}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={true}
          />
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCropConfirm}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CropModal;
