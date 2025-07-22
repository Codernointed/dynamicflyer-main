/**
 * Simple Canvas Editor Component
 * HTML5 Canvas-based editor without Fabric.js dependencies
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface FrameData {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    placeholder?: string;
  };
}

interface CanvasEditorProps {
  backgroundUrl: string;
  frames: FrameData[];
  selectedFrameId: string | null;
  onFramesChange: (frames: FrameData[]) => void;
  onFrameSelect: (frameId: string | null) => void;
  onCanvasReady: (ready: boolean) => void;
}

export default function SimpleCanvasEditor({
  backgroundUrl,
  frames,
  selectedFrameId,
  onFramesChange,
  onFrameSelect,
  onCanvasReady,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;


    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 800;
    const height = 600;
    setCanvasSize({ width, height });
    canvas.width = width;
    canvas.height = height;

    // Clear canvas and draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw test rectangle
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.fillRect(50, 50, 100, 100);
    ctx.strokeRect(50, 50, 100, 100);


    onCanvasReady(true);
  }, [onCanvasReady]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeCanvas();
    }, 100);

    return () => {
      clearTimeout(timer);
      onCanvasReady(false);
    };
  }, [initializeCanvas, onCanvasReady]);

  // Load background image
  const loadBackgroundImage = useCallback(async () => {
    if (!canvasRef.current || !backgroundUrl) {

      return;
    }


    setIsLoading(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
  
          setBackgroundImage(img);
          resolve();
        };
        img.onerror = reject;
        img.src = backgroundUrl;
      });

      renderCanvas();
    } catch (error) {
      console.error('❌ Error loading background image:', error);
      toast.error('Failed to load background image');
    } finally {
      setIsLoading(false);
    }
  }, [backgroundUrl]);

  // Load background when URL changes
  useEffect(() => {
    if (backgroundUrl) {
      loadBackgroundImage();
    }
  }, [backgroundUrl, loadBackgroundImage]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    if (backgroundImage) {
      const scaleX = canvas.width / backgroundImage.width;
      const scaleY = canvas.height / backgroundImage.height;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(backgroundImage, x, y, scaledWidth, scaledHeight);
    }

    // Draw frames
    frames.forEach(frame => {
      const isSelected = frame.id === selectedFrameId;
      
      ctx.strokeStyle = frame.type === 'image' ? '#0066ff' : '#ff6600';
      ctx.fillStyle = frame.type === 'image' ? 'rgba(0, 100, 255, 0.3)' : 'rgba(255, 100, 0, 0.3)';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      // Draw dashed rectangle
      ctx.setLineDash([5, 5]);
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);

      // Draw frame type label
      ctx.fillStyle = frame.type === 'image' ? '#0066ff' : '#ff6600';
      ctx.font = '12px Arial';
      ctx.fillText(frame.type.toUpperCase(), frame.x + 5, frame.y + 15);
    });
  }, [backgroundImage, frames, selectedFrameId]);

  // Render when frames change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Check if clicking on a frame
    const clickedFrame = frames.find(frame => 
      x >= frame.x && x <= frame.x + frame.width &&
      y >= frame.y && y <= frame.y + frame.height
    );

    if (clickedFrame) {
      setSelectedFrame(clickedFrame);
      onFrameSelect(clickedFrame.id);
      setIsDragging(true);
      setDragStart({ x: x - clickedFrame.x, y: y - clickedFrame.y });
    } else {
      onFrameSelect(null);
      setSelectedFrame(null);
    }
  }, [frames, zoom, onFrameSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedFrame) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const newX = Math.max(0, x - dragStart.x);
    const newY = Math.max(0, y - dragStart.y);

    const updatedFrames = frames.map(frame => 
      frame.id === selectedFrame.id 
        ? { ...frame, x: newX, y: newY }
        : frame
    );

    onFramesChange(updatedFrames);
  }, [isDragging, selectedFrame, dragStart, frames, zoom, onFramesChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setSelectedFrame(null);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'template-preview.png';
    link.href = dataURL;
    link.click();
  };



  if (!backgroundUrl) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Canvas Controls */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">No background image</span>
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export Preview
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <Card className="flex-1 p-4 bg-gray-50 overflow-hidden">
          <div className="relative h-full">
            <div className="flex justify-center items-center h-full">
              <canvas
                ref={canvasRef}
                className="border-2 border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer"
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ 
                  width: canvasSize.width * zoom, 
                  height: canvasSize.height * zoom,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  backgroundColor: '#f0f0f0'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            
            {/* Instructions */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500 max-w-md bg-white/90 backdrop-blur-sm rounded-lg p-6 border">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a background image</h3>
                <p className="text-sm text-gray-500 mb-4">Go to the Setup tab to add your template background image</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Start:</h4>
                  <ol className="text-xs text-blue-800 space-y-1">
                    <li>1. Click "Setup" tab on the left</li>
                    <li>2. Upload a background image</li>
                    <li>3. Switch to "Frames" tab</li>
                    <li>4. Add image and text frames</li>
                    <li>5. Customize with "Style" tab</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500 text-center space-y-1 flex-shrink-0">
          <p>Canvas is ready - upload a background image to start editing</p>
          <p>Recommended size: 1200×800 pixels or larger</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas Controls */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {canvasSize.width} × {canvasSize.height}
          </span>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Preview
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <Card className="flex-1 p-4 bg-gray-50 overflow-hidden">
        <div className="relative h-full">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="flex justify-center items-center h-full">
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer"
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ 
                width: canvasSize.width * zoom, 
                height: canvasSize.height * zoom,
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                backgroundColor: '#ffffff'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
        <p>Click and drag to move frames • Blue = Image frames • Orange = Text frames</p>
        <p>Professional template editor for creating personalized designs</p>
      </div>
    </div>
  );
} 