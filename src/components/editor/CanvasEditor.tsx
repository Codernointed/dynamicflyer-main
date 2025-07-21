/**
 * Canvas Editor Component
 * Main Fabric.js canvas wrapper for template editing
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import fabric, { Canvas, Image, Rect } from 'fabric';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

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
  console.log('🎨 CanvasEditor received props:', { 
    backgroundUrl, 
    framesCount: frames.length, 
    selectedFrameId,
    hasBackgroundUrl: !!backgroundUrl 
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Calculate canvas size based on container
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return { width: 1200, height: 800 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 32; // Account for padding
    const maxWidth = Math.min(containerWidth, 1400); // Max width limit
    const maxHeight = Math.min(window.innerHeight - 300, 900); // Max height limit
    
    // Maintain 3:2 aspect ratio
    const aspectRatio = 3 / 2;
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
  }, []);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    // Calculate initial size
    const initialSize = calculateCanvasSize();
    setCanvasSize(initialSize);

    console.log('🎨 Initializing Fabric.js canvas with size:', initialSize);

    const canvas = new Canvas(canvasRef.current, {
      width: initialSize.width,
      height: initialSize.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    // Ensure canvas is visible
    canvas.renderAll();
    console.log('✅ Canvas initialized successfully');

    fabricCanvasRef.current = canvas;
    setCanvasInitialized(true);
    onCanvasReady(true);

    // Canvas event handlers
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => onFrameSelect(null));
    canvas.on('object:modified', handleObjectModified);
  }, [calculateCanvasSize, onCanvasReady]);

  // Initialize canvas on mount
  useEffect(() => {
    initializeCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        console.log('🧹 Disposing canvas');
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvasInitialized(false);
        onCanvasReady(false);
      }
    };
  }, [initializeCanvas, onCanvasReady]);

  // Handle window resize without recreating canvas
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateCanvasSize();
      setCanvasSize(newSize);
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setWidth(newSize.width);
        fabricCanvasRef.current.setHeight(newSize.height);
        fabricCanvasRef.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCanvasSize]);

  // Load background image
  const loadBackgroundImage = useCallback(async () => {
    if (!fabricCanvasRef.current || !backgroundUrl) {
      console.log('⏳ Canvas not ready or no background URL:', { 
        hasCanvas: !!fabricCanvasRef.current, 
        backgroundUrl 
      });
      return;
    }

    console.log('🎨 Loading background image:', backgroundUrl);
    setIsLoading(true);
    
    try {
      const img = await new Promise<fabric.Image>((resolve, reject) => {
        Image.fromURL(backgroundUrl, {
          crossOrigin: 'anonymous'
        }).then(resolve).catch(reject);
      });

      console.log('✅ Background image loaded successfully', { 
        width: img.width, 
        height: img.height,
        canvasWidth: fabricCanvasRef.current?.width,
        canvasHeight: fabricCanvasRef.current?.height
      });
      
      const canvas = fabricCanvasRef.current!;
      
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasAspect = canvas.width! / canvas.height!;
      const imageAspect = img.width! / img.height!;
      
      let scale;
      if (imageAspect > canvasAspect) {
        scale = canvas.width! / img.width!;
      } else {
        scale = canvas.height! / img.height!;
      }
      
      console.log('📐 Image scaling:', { scale, canvasAspect, imageAspect });
      
      img.scale(scale);
      img.setCoords();
      
      // Make background image non-selectable and non-movable
      img.set({
        selectable: false,
        evented: false,
        excludeFromExport: false,
      });
      
      console.log('🧹 Clearing canvas and adding background...');
      // Clear canvas and add background
      canvas.clear();
      canvas.add(img);
      canvas.centerObject(img);
      canvas.sendObjectToBack(img);
      
      console.log('🎨 Canvas objects after background add:', canvas.getObjects().length);
      
      // Force render
      canvas.renderAll();
      
      // Re-add frames after background
      syncFramesToCanvas();
      console.log('✅ Canvas updated with background and frames');
    } catch (error) {
      console.error('❌ Error loading background image:', error);
      console.error('📄 Image URL:', backgroundUrl);
      console.error('🔍 Error type:', error.name);
      console.error('💬 Error message:', error.message);
      console.error('📋 Full error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [backgroundUrl]);

  // Load background when URL changes and canvas is ready
  useEffect(() => {
    if (canvasInitialized && backgroundUrl) {
      loadBackgroundImage();
    }
  }, [canvasInitialized, backgroundUrl, loadBackgroundImage]);

  // Sync frames to canvas
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    syncFramesToCanvas();
  }, [frames]);

  const syncFramesToCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('🔄 Syncing frames to canvas, frame count:', frames.length);

    // Remove existing frame objects (keep background)
    const objects = canvas.getObjects();
    const frameObjects = objects.filter(obj => (obj as any).data?.isFrame);
    frameObjects.forEach(obj => canvas.remove(obj));

    // Add frame objects
    frames.forEach(frame => {
      let fabricObject;
      
      if (frame.type === 'image') {
        fabricObject = new Rect({
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          fill: 'rgba(200, 200, 255, 0.3)',
          stroke: '#4285f4',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          rx: 4,
          ry: 4,
        });
      } else {
        fabricObject = new Rect({
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          fill: 'rgba(255, 200, 200, 0.3)',
          stroke: '#ea4335',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          rx: 4,
          ry: 4,
        });
      }

      (fabricObject as any).data = {
        isFrame: true,
        frameId: frame.id,
        frameType: frame.type,
      };

      canvas.add(fabricObject);
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
      multiplier: 2, // Higher resolution
    });
    
    const link = document.createElement('a');
    link.download = 'template-preview.png';
    link.href = dataURL;
    link.click();
  };

  if (!backgroundUrl) {
    return (
      <div className="w-full h-full flex flex-col" ref={containerRef}>
        {/* Canvas Controls */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-16 text-center">100%</span>
            <Button variant="outline" size="sm" disabled>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">No background</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Test with a simple colored background
                if (fabricCanvasRef.current) {
                  fabricCanvasRef.current.backgroundColor = '#f0f0f0';
                  fabricCanvasRef.current.renderAll();
                  console.log('✅ Test background applied');
                }
              }}
            >
              Test Canvas
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export Preview
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <Card className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a background image to start editing</h3>
            <p className="text-sm text-gray-500 mb-4">Go to the Setup tab to add your template background image</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
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
        </Card>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500 text-center space-y-1 flex-shrink-0">
          <p>Canvas will appear here once you upload a background image</p>
          <p>Recommended size: 1200×800 pixels or larger</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" ref={containerRef}>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🧪 Testing canvas functionality...');
              if (fabricCanvasRef.current) {
                // Add a test rectangle to verify canvas works
                const testRect = new Rect({
                  left: 50,
                  top: 50,
                  width: 100,
                  height: 100,
                  fill: 'red',
                  stroke: 'blue',
                  strokeWidth: 2,
                });
                fabricCanvasRef.current.add(testRect);
                fabricCanvasRef.current.renderAll();
                console.log('✅ Test rectangle added to canvas');
              } else {
                console.log('❌ Canvas not initialized');
              }
            }}
          >
            Test Canvas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🧪 Testing background loading manually...');
              console.log('🔍 Current state:', { 
                hasCanvas: !!fabricCanvasRef.current, 
                backgroundUrl,
                canvasObjects: fabricCanvasRef.current?.getObjects().length 
              });
              
              if (fabricCanvasRef.current && backgroundUrl) {
                loadBackgroundImage();
              } else {
                console.log('❌ Canvas or background URL not available');
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
              className="border-2 border-gray-300 rounded-lg shadow-lg bg-white max-w-full max-h-full"
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ 
                width: canvasSize.width, 
                height: canvasSize.height,
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                minWidth: '400px',
                minHeight: '300px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
        <p>Click and drag to move frames • Use corner handles to resize</p>
        <p>Blue dashed areas = Image frames • Red dashed areas = Text frames</p>
      </div>
    </div>
  );
} 