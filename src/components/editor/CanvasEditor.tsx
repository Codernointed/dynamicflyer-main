/**
 * Canvas Editor Component
 * Simplified and reliable Fabric.js canvas wrapper for template editing
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import fabric from 'fabric';
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

export default function CanvasEditor({
  backgroundUrl,
  frames,
  selectedFrameId,
  onFramesChange,
  onFrameSelect,
  onCanvasReady,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    console.log('🎨 Initializing canvas...');
    
    // Set canvas size
    const width = 800;
    const height = 600;
    setCanvasSize({ width, height });

    // Create fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8f9fa',
      selection: true,
      preserveObjectStacking: true,
    });

    // Add a test rectangle to verify canvas works
    const testRect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: 'rgba(255, 0, 0, 0.5)',
      stroke: '#ff0000',
      strokeWidth: 2,
      selectable: true,
    });
    
    canvas.add(testRect);
    canvas.renderAll();
    
    console.log('✅ Canvas initialized successfully');

    fabricCanvasRef.current = canvas;
    onCanvasReady(true);

    // Event handlers
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => onFrameSelect(null));
    canvas.on('object:modified', handleObjectModified);

  }, [onCanvasReady]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeCanvas();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        onCanvasReady(false);
      }
    };
  }, [initializeCanvas, onCanvasReady]);

  // Load background image
  const loadBackgroundImage = useCallback(async () => {
    if (!fabricCanvasRef.current || !backgroundUrl) {
      console.log('⏳ Canvas not ready or no background URL');
      return;
    }

    console.log('🎨 Loading background image:', backgroundUrl);
    setIsLoading(true);
    
    try {
      const canvas = fabricCanvasRef.current;

      // Load image using Promise-based approach
      const templateImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = backgroundUrl;
      });

      const fabricImage = new fabric.Image(templateImg);
      
      // Scale image to fit canvas
      const scaleX = canvas.width! / fabricImage.width!;
      const scaleY = canvas.height! / fabricImage.height!;
      const scale = Math.min(scaleX, scaleY);

      fabricImage.scale(scale);
      fabricImage.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      
      // Clear canvas and add image
      canvas.clear();
      canvas.add(fabricImage);
      canvas.renderAll();
      
      console.log('✅ Background image added to canvas');
      
      // Add frames
      syncFramesToCanvas();
      
    } catch (error) {
      console.error('❌ Error loading background image:', error);
      toast.error('Failed to load background image');
    } finally {
      setIsLoading(false);
    }
  }, [backgroundUrl]);

  // Load background when URL changes
  useEffect(() => {
    if (fabricCanvasRef.current && backgroundUrl) {
      loadBackgroundImage();
    }
  }, [backgroundUrl, loadBackgroundImage]);

  // Sync frames
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    syncFramesToCanvas();
  }, [frames]);

  const syncFramesToCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('🔄 Syncing frames to canvas, frame count:', frames.length);

    // Remove existing frames
    const objects = canvas.getObjects();
    const frameObjects = objects.filter(obj => (obj as any).data?.isFrame);
    frameObjects.forEach(obj => canvas.remove(obj));

    // Add new frames
    frames.forEach(frame => {
      const rect = new fabric.Rect({
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        fill: frame.type === 'image' ? 'rgba(0, 100, 255, 0.3)' : 'rgba(255, 100, 0, 0.3)',
        stroke: frame.type === 'image' ? '#0066ff' : '#ff6600',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
        evented: true,
      });

      (rect as any).data = {
        isFrame: true,
        frameId: frame.id,
        frameType: frame.type,
      };

      canvas.add(rect);
    });

    canvas.renderAll();
  };

  const handleSelection = (e: any) => {
    const activeObject = e.target;
    if ((activeObject as any)?.data?.isFrame) {
      onFrameSelect((activeObject as any).data.frameId);
    } else {
      onFrameSelect(null);
    }
  };

  const handleObjectModified = (e: any) => {
    const obj = e.target;
    if (!(obj as any)?.data?.isFrame) return;

    const frameId = (obj as any).data.frameId;
    const updatedFrames = frames.map(frame => {
      if (frame.id === frameId) {
        return {
          ...frame,
          x: Math.round(obj.left || 0),
          y: Math.round(obj.top || 0),
          width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
          height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
        };
      }
      return frame;
    });

    onFramesChange(updatedFrames);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    fabricCanvasRef.current?.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
    fabricCanvasRef.current?.setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    fabricCanvasRef.current?.setZoom(1);
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = 'template-preview.png';
    link.href = dataURL;
    link.click();
  };

  const handleTestCanvas = () => {
    console.log('🧪 Testing canvas functionality...');
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      // Clear canvas
      canvas.clear();
      
      // Set background color
      canvas.backgroundColor = '#e0e0e0';
      canvas.renderAll();
      
      // Add test rectangle
      const testRect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 150,
        fill: 'rgba(255, 0, 0, 0.7)',
        stroke: '#ff0000',
        strokeWidth: 3,
      });
      
      canvas.add(testRect);
      canvas.renderAll();
      console.log('✅ Test canvas setup complete - you should see a red rectangle');
    }
  };

  const handleDebugCanvas = () => {
    console.log('🔍 Debug canvas state...');
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      console.log('📊 Canvas state:', {
        width: canvas.width,
        height: canvas.height,
        backgroundColor: canvas.backgroundColor,
        objectCount: objects.length,
        objects: objects.map((obj, index) => ({
          index,
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          visible: obj.visible,
        }))
      });
      
      canvas.renderAll();
      console.log('🔄 Canvas re-rendered');
    }
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
            <Button variant="outline" size="sm" onClick={handleTestCanvas}>
              Test Canvas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDebugCanvas}>
              Debug Canvas
            </Button>
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
                className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ 
                  width: canvasSize.width, 
                  height: canvasSize.height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  backgroundColor: '#f0f0f0'
                }}
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
          <Button variant="outline" size="sm" onClick={handleTestCanvas}>
            Test Canvas
          </Button>
          <Button variant="outline" size="sm" onClick={handleDebugCanvas}>
            Debug Canvas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🧪 Testing background loading manually...');
              if (fabricCanvasRef.current && backgroundUrl) {
                loadBackgroundImage();
              }
            }}
          >
            Test Background
          </Button>
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
              className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ 
                width: canvasSize.width, 
                height: canvasSize.height,
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
        <p>Click and drag to move frames • Use corner handles to resize</p>
        <p>Blue dashed areas = Image frames • Orange dashed areas = Text frames</p>
      </div>
    </div>
  );
} 