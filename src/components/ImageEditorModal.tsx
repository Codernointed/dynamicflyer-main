import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Move, 
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface FrameData {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'rounded-rectangle' | 'polygon';
  cornerRadius?: number;
  polygonSides?: number;
}

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  frame: FrameData;
  onApply: (editedImageUrl: string, transformData: any) => void;
  previousTransformData?: any; // Add previous transform data for re-editing
}

interface TransformData {
  scale: number;
  rotation: number;
  x: number;
  y: number;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  open,
  onClose,
  imageFile,
  frame,
  onApply,
  previousTransformData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<TransformData>({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [viewScale, setViewScale] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      // Initialize transform to fit image within frame
      initializeTransform(img);
    };
    img.onerror = () => {
      toast.error('Failed to load image');
    };
    img.src = URL.createObjectURL(imageFile);
  }, [imageFile]);

  // Initialize transform to fit image within frame
  const initializeTransform = useCallback((img: HTMLImageElement) => {
    if (!canvasRef.current) return;

    // If we have previous transform data, use it (for re-editing)
    if (previousTransformData) {
      setTransform(previousTransformData);
      return;
    }

    // Calculate scale to cover the frame (for new images)
    const scaleX = frame.width / img.width;
    const scaleY = frame.height / img.height;
    const scale = Math.max(scaleX, scaleY); // Cover the frame completely

    setTransform({
      scale,
      rotation: 0,
      x: 0,
      y: 0
    });
  }, [frame, previousTransformData]);

  // Calculate view scale to fit frame on canvas
  useEffect(() => {
    if (!frame) return;
    
    const padding = 20; // Reduced padding for maximizing space
    const availableWidth = canvasSize.width - padding * 2;
    const availableHeight = canvasSize.height - padding * 2;
    
    const scaleX = availableWidth / frame.width;
    const scaleY = availableHeight / frame.height;
    
    // Auto-fit frame to the available preview space
    const newViewScale = Math.min(scaleX, scaleY);
    setViewScale(newViewScale);
  }, [frame, canvasSize]);

  // Draw everything
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate frame position (center of canvas)
    const frameX = (canvas.width - frame.width * viewScale) / 2;
    const frameY = (canvas.height - frame.height * viewScale) / 2;

    // Draw background overlay outside the frame area
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the frame area
    ctx.globalCompositeOperation = 'destination-out';
    
    ctx.save();
    const clearFrameCenterX = frameX + (frame.width * viewScale) / 2;
    const clearFrameCenterY = frameY + (frame.height * viewScale) / 2;
    ctx.translate(clearFrameCenterX, clearFrameCenterY);
    ctx.rotate((frame.rotation * Math.PI) / 180);
    ctx.scale(viewScale, viewScale);
    ctx.translate(-frame.width / 2, -frame.height / 2);
    
    switch (frame.shape) {
      case 'circle': {
        const radius = Math.min(frame.width, frame.height) / 2;
        ctx.beginPath();
        ctx.arc(frame.width / 2, frame.height / 2, radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
      }
      case 'rounded-rectangle': {
        const radius = frame.cornerRadius || 20;
        ctx.beginPath();
        ctx.roundRect(0, 0, frame.width, frame.height, radius);
        ctx.fill();
        break;
      }
      case 'polygon': {
        const sides = frame.polygonSides || 6;
        const radius = Math.min(frame.width, frame.height) / 2;
        
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = frame.width / 2 + radius * Math.cos(angle);
          const y = frame.height / 2 + radius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      default: // rectangle
        ctx.fillRect(0, 0, frame.width, frame.height);
    }
    
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // Save context
    ctx.save();

    // Move to frame center
    const frameCenterX = frameX + (frame.width * viewScale) / 2;
    const frameCenterY = frameY + (frame.height * viewScale) / 2;

    // Apply transformations
    ctx.translate(frameCenterX, frameCenterY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale * viewScale, transform.scale * viewScale);
    ctx.translate(transform.x, transform.y);

    // Draw image
    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width,
      image.height
    );

    // Restore context
    ctx.restore();

    // Draw frame boundary on top
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    
    ctx.save();
    ctx.translate(frameCenterX, frameCenterY);
    ctx.rotate((frame.rotation * Math.PI) / 180);
    ctx.scale(viewScale, viewScale);
    ctx.translate(-frame.width / 2, -frame.height / 2);
    
    ctx.beginPath();
    switch (frame.shape) {
      case 'circle': {
        const radius = Math.min(frame.width, frame.height) / 2;
        ctx.arc(frame.width / 2, frame.height / 2, radius, 0, 2 * Math.PI);
        break;
      }
      case 'rounded-rectangle': {
        const radius = frame.cornerRadius || 20;
        ctx.roundRect(0, 0, frame.width, frame.height, radius);
        break;
      }
      case 'polygon': {
        const sides = frame.polygonSides || 6;
        const radius = Math.min(frame.width, frame.height) / 2;
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = frame.width / 2 + radius * Math.cos(angle);
          const y = frame.height / 2 + radius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        break;
      }
      default: // rectangle
        ctx.rect(0, 0, frame.width, frame.height);
    }
    ctx.stroke();
    ctx.restore();
  }, [image, transform, frame, viewScale]);

  // Redraw when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse event handlers - drag to move, wheel to zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setTransform(prev => ({
      ...prev,
      x: prev.x + deltaX / (transform.scale * viewScale),
      y: prev.y + deltaY / (transform.scale * viewScale)
    }));

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel to zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomFactor));
    
    setTransform(prev => ({
      ...prev,
      scale: newScale
    }));
  };

  // Touch events for pinch to zoom
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touches: any) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      setTouchStart({
        x: 0,
        y: 0,
        distance: getDistance(e.touches)
      });
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      setDragStart({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (isPinching && e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      if (touchStart.distance > 0) {
        const scaleFactor = currentDistance / touchStart.distance;
        const newScale = Math.max(0.1, Math.min(5, transform.scale * scaleFactor));
        
        setTransform(prev => ({
          ...prev,
          scale: newScale
        }));
        
        setTouchStart(prev => ({ ...prev, distance: currentDistance }));
      }
    } else if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX / (transform.scale * viewScale),
        y: prev.y + deltaY / (transform.scale * viewScale)
      }));

      setDragStart({ x, y });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
  };

  // Control handlers
  const handleZoomChange = (value: number[]) => {
    setTransform(prev => ({ ...prev, scale: value[0] }));
  };

  const handleRotationChange = (value: number[]) => {
    setTransform(prev => ({ ...prev, rotation: value[0] }));
  };

  const handleRotateLeft = () => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation - 90 }));
  };

  const handleRotateRight = () => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation + 90 }));
  };

  const handleReset = () => {
    if (image) {
      initializeTransform(image);
      
      // Also reset viewScale
      const padding = 20;
      const availableWidth = canvasSize.width - padding * 2;
      const availableHeight = canvasSize.height - padding * 2;
      const scaleX = availableWidth / frame.width;
      const scaleY = availableHeight / frame.height;
      setViewScale(Math.min(scaleX, scaleY));
    }
  };

  // Apply changes
  const handleApply = async () => {
    if (!canvasRef.current || !image) return;

    setLoading(true);
    try {
      // Create a temporary canvas to generate the final image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Failed to get canvas context');

      // Set canvas size to frame size
      tempCanvas.width = frame.width;
      tempCanvas.height = frame.height;

      // Apply ONLY user transformations (no frame rotation - that's handled by main canvas)
      const frameCenterX = frame.width / 2;
      const frameCenterY = frame.height / 2;
      
      tempCtx.save();
      
      // Apply ONLY user transformations (scale, user rotation, position)
      tempCtx.translate(frameCenterX, frameCenterY);
      tempCtx.rotate((transform.rotation * Math.PI) / 180);
      tempCtx.scale(transform.scale, transform.scale);
      tempCtx.translate(transform.x, transform.y);

      // Draw image (upright - frame rotation will be applied by main canvas)
      tempCtx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height
      );

      tempCtx.restore();

      // Create clipping path based on frame shape (upright rectangle)
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.beginPath();
      
      // Create upright shape (frame rotation will be applied by main canvas)
      tempCtx.save();
      
      switch (frame.shape) {
        case 'circle': {
          const radius = Math.min(frame.width, frame.height) / 2;
          tempCtx.arc(frameCenterX, frameCenterY, radius, 0, 2 * Math.PI);
          break;
        }
        case 'rounded-rectangle': {
          const radius = frame.cornerRadius || 20;
          tempCtx.roundRect(0, 0, frame.width, frame.height, radius);
          break;
        }
        case 'polygon': {
          const sides = frame.polygonSides || 6;
          const radius = Math.min(frame.width, frame.height) / 2;
          
          for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = frameCenterX + radius * Math.cos(angle);
            const y = frameCenterY + radius * Math.sin(angle);
            if (i === 0) {
              tempCtx.moveTo(x, y);
            } else {
              tempCtx.lineTo(x, y);
            }
          }
          tempCtx.closePath();
          break;
        }
        default: // rectangle
          tempCtx.rect(0, 0, frame.width, frame.height);
      }
      
      tempCtx.restore();
      tempCtx.fill();
      tempCtx.globalCompositeOperation = 'source-over';

      // Convert to data URL
      const dataURL = tempCanvas.toDataURL('image/png', 1.0);
      
      onApply(dataURL, transform);
      onClose();
    } catch (error) {
      console.error('Error applying image:', error);
      toast.error('Failed to apply image changes');
    } finally {
      setLoading(false);
    }
  };

  if (!imageFile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Edit Image</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col p-0">
          {/* Preview Area (Expanded Cyan) */}
          <div className="relative flex items-center justify-center p-2 min-h-[300px] sm:min-h-[400px]">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border border-gray-200 rounded-lg shadow-sm cursor-move max-w-full h-auto object-contain bg-white"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Controls Area (Green shifted below) */}
          <div className="p-4 sm:p-6 bg-white border-t space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="h-4 w-4 text-blue-500" />
                  Image Controls
                </h3>
              </div>
              
              {/* Zoom Control */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium">
                  <span>Zoom</span>
                  <span className="text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded text-xs">
                    {Math.round(transform.scale * 100)}%
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[transform.scale]}
                    onValueChange={handleZoomChange}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.01) }))}
                  >
                    -1%
                  </Button>
                  <div className="flex-1 flex justify-center">
                    <input
                      type="number"
                      value={Math.round(transform.scale * 100)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) / 100;
                        if (!isNaN(value)) {
                          setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(3, value)) }));
                        }
                      }}
                      className="w-16 h-8 text-center border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      min="10"
                      max="300"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.01) }))}
                  >
                    +1%
                  </Button>
                </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium">
                  <span>Rotation</span>
                  <span className="text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded text-xs">
                    {transform.rotation}°
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleRotateLeft}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[transform.rotation]}
                    onValueChange={handleRotationChange}
                    min={-180}
                    max={180}
                    step={1}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleRotateRight}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setTransform(prev => ({ ...prev, rotation: Math.max(-180, prev.rotation - 1) }))}
                  >
                    -1°
                  </Button>
                  <div className="flex-1 flex justify-center">
                    <input
                      type="number"
                      value={Math.round(transform.rotation)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTransform(prev => ({ ...prev, rotation: Math.max(-180, Math.min(180, value)) }));
                        }
                      }}
                      className="w-16 h-8 text-center border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      min="-180"
                      max="180"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setTransform(prev => ({ ...prev, rotation: Math.min(180, prev.rotation + 1) }))}
                  >
                    +1°
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2 justify-center"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset View
                </Button>
                
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 sm:flex-none justify-center"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] flex-1 sm:flex-none justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Applying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorModal; 