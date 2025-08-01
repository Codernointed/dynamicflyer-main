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
    const frameX = (canvas.width - frame.width) / 2;
    const frameY = (canvas.height - frame.height) / 2;

    // Draw white overlay outside the frame area
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the frame area (make it transparent to show image)
    ctx.globalCompositeOperation = 'destination-out';
    
    // Apply frame rotation for clearing
    ctx.save();
    const clearFrameCenterX = frameX + frame.width / 2;
    const clearFrameCenterY = frameY + frame.height / 2;
    ctx.translate(clearFrameCenterX, clearFrameCenterY);
    ctx.rotate((frame.rotation * Math.PI) / 180);
    ctx.translate(-clearFrameCenterX, -clearFrameCenterY);
    
    switch (frame.shape) {
      case 'circle': {
        const radius = Math.min(frame.width, frame.height) / 2;
        ctx.beginPath();
        ctx.arc(clearFrameCenterX, clearFrameCenterY, radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
      }
      case 'rounded-rectangle': {
        const radius = frame.cornerRadius || 20;
        ctx.beginPath();
        ctx.roundRect(frameX, frameY, frame.width, frame.height, radius);
        ctx.fill();
        break;
      }
      case 'polygon': {
        const sides = frame.polygonSides || 6;
        const radius = Math.min(frame.width, frame.height) / 2;
        
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = clearFrameCenterX + radius * Math.cos(angle);
          const y = clearFrameCenterY + radius * Math.sin(angle);
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
        ctx.fillRect(frameX, frameY, frame.width, frame.height);
    }
    
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // Save context
    ctx.save();

    // Move to frame center
    const frameCenterX = frameX + frame.width / 2;
    const frameCenterY = frameY + frame.height / 2;

    // Apply transformations
    ctx.translate(frameCenterX, frameCenterY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
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
    ctx.setLineDash([]);
    
    // Apply frame rotation for boundary
    ctx.save();
    const boundaryFrameCenterX = frameX + frame.width / 2;
    const boundaryFrameCenterY = frameY + frame.height / 2;
    ctx.translate(boundaryFrameCenterX, boundaryFrameCenterY);
    ctx.rotate((frame.rotation * Math.PI) / 180);
    ctx.translate(-boundaryFrameCenterX, -boundaryFrameCenterY);
    
    ctx.beginPath();
    switch (frame.shape) {
      case 'circle': {
        const radius = Math.min(frame.width, frame.height) / 2;
        ctx.arc(boundaryFrameCenterX, boundaryFrameCenterY, radius, 0, 2 * Math.PI);
        break;
      }
      case 'rounded-rectangle': {
        const radius = frame.cornerRadius || 20;
        ctx.roundRect(frameX, frameY, frame.width, frame.height, radius);
        break;
      }
      case 'polygon': {
        const sides = frame.polygonSides || 6;
        const radius = Math.min(frame.width, frame.height) / 2;
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = boundaryFrameCenterX + radius * Math.cos(angle);
          const y = boundaryFrameCenterY + radius * Math.sin(angle);
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
        ctx.rect(frameX, frameY, frame.width, frame.height);
    }
    ctx.stroke();
    ctx.restore();
  }, [image, transform, frame]);

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
      x: prev.x + deltaX / transform.scale,
      y: prev.y + deltaY / transform.scale
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
        x: prev.x + deltaX / transform.scale,
        y: prev.y + deltaY / transform.scale
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

      // Only apply user transformations - NO frame rotation to image content
      const frameCenterX = frame.width / 2;
      const frameCenterY = frame.height / 2;
      
      tempCtx.save();
      
      // Apply ONLY user transformations (no frame rotation)
      tempCtx.translate(frameCenterX, frameCenterY);
      tempCtx.rotate((transform.rotation * Math.PI) / 180);
      tempCtx.scale(transform.scale, transform.scale);
      tempCtx.translate(transform.x, transform.y);

      // Draw image (always upright)
      tempCtx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height
      );

      tempCtx.restore();

      // Create clipping path based on frame shape (with frame rotation)
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.beginPath();
      
      // Apply frame rotation ONLY for clipping (not for image content)
      tempCtx.save();
      tempCtx.translate(frameCenterX, frameCenterY);
      tempCtx.rotate((frame.rotation * Math.PI) / 180);
      tempCtx.translate(-frameCenterX, -frameCenterY);
      
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
      <DialogContent className="max-w-[98vw] w-[1200px] h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Edit Image</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Drag to move, scroll wheel to zoom, pinch to zoom on mobile. Use controls below for precise adjustments. 
            <span className="text-blue-600 font-medium"> Clear area</span> shows what will appear in your template.
          </p>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Canvas Container */}
          <div className="flex-1 relative bg-gray-50 flex items-center justify-center p-4 min-h-0">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border border-gray-200 rounded-lg shadow-sm cursor-move max-w-full max-h-full object-contain"
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

          {/* Controls */}
          <div className="w-80 lg:w-96 p-4 border-l bg-gray-50 overflow-y-auto flex-shrink-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Image Controls</h3>
              </div>
              
              {/* Zoom Control */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium mb-2">
                  <span>Zoom</span>
                  <span className="text-muted-foreground">{Math.round(transform.scale * 100)}%</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
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
                    size="sm"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.01) }))}
                  >
                    ↑
                  </Button>
                  <input
                    type="number"
                    value={Math.round(transform.scale * 100)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) / 100;
                      if (!isNaN(value)) {
                        setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(3, value)) }));
                      }
                    }}
                    className="w-16 px-2 py-1 text-center border rounded text-sm"
                    min="10"
                    max="300"
                    step="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.01) }))}
                  >
                    ↓
                  </Button>
                </div>
              </div>

              {/* Rotation Control */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium mb-2">
                  <span>Rotation</span>
                  <span className="text-muted-foreground">{transform.rotation}°</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
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
                    size="sm"
                    onClick={handleRotateRight}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransform(prev => ({ ...prev, rotation: Math.max(-180, prev.rotation - 1) }))}
                  >
                    ↑
                  </Button>
                  <input
                    type="number"
                    value={Math.round(transform.rotation)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setTransform(prev => ({ ...prev, rotation: Math.max(-180, Math.min(180, value)) }));
                      }
                    }}
                    className="w-16 px-2 py-1 text-center border rounded text-sm"
                    min="-180"
                    max="180"
                    step="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransform(prev => ({ ...prev, rotation: Math.min(180, prev.rotation + 1) }))}
                  >
                    ↓
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleReset}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 rounded-full border-2 border-background/20 border-t-background animate-spin"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Apply
                      </>
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