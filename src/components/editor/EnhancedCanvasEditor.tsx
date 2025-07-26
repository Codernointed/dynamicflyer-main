/**
 * Enhanced Canvas Editor Component
 * Advanced HTML5 Canvas-based editor with resizable frames, complex shapes, and intuitive UX
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download, Move, Square, Circle, Type, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface FrameData {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'rounded-rectangle' | 'polygon';
  cornerRadius?: number; // For rounded rectangles
  points?: number[][]; // For polygons
  properties?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    placeholder?: string;
    content?: string;
  };
}

interface CanvasEditorProps {
  backgroundUrl: string;
  frames: FrameData[];
  selectedFrameId: string | null;
  onFramesChange?: (frames: FrameData[]) => void;
  onFrameSelect: (frameId: string | null) => void;
  onCanvasReady: (ready: boolean) => void;
  readOnly?: boolean;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  startX: number;
  startY: number;
  startFrame: FrameData | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
}

const RESIZE_HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 30;
const SNAP_THRESHOLD = 10;
const GRID_SIZE = 20; // Grid size for snapping
const SNAP_DISTANCE = 10; // Distance for snapping to grid and other frames

export default function EnhancedCanvasEditor({
  backgroundUrl,
  frames,
  selectedFrameId,
  onFramesChange,
  onFrameSelect,
  onCanvasReady,
  readOnly = false,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    startX: 0,
    startY: 0,
    startFrame: null,
    resizeHandle: null,
  });
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number; type: 'horizontal' | 'vertical' }[]>([]);

  const selectedFrame = useMemo(() => 
    frames.find(f => f.id === selectedFrameId) || null, 
    [frames, selectedFrameId]
  );

  // Snap functions
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const snapToFrame = (x: number, y: number, excludeFrameId?: string): { x: number; y: number; snapLines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] } => {
    let snappedX = x;
    let snappedY = y;
    const lines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] = [];
    
    frames.forEach(frame => {
      if (frame.id === excludeFrameId) return;
      
      // Snap to frame edges
      const frameLeft = frame.x;
      const frameRight = frame.x + frame.width;
      const frameTop = frame.y;
      const frameBottom = frame.y + frame.height;
      const frameCenterX = frame.x + frame.width / 2;
      const frameCenterY = frame.y + frame.height / 2;
      
      // Horizontal snapping
      if (Math.abs(x - frameLeft) < SNAP_DISTANCE) {
        snappedX = frameLeft;
        lines.push({ x: frameLeft, type: 'vertical' });
      }
      if (Math.abs(x - frameRight) < SNAP_DISTANCE) {
        snappedX = frameRight;
        lines.push({ x: frameRight, type: 'vertical' });
      }
      if (Math.abs(x - frameCenterX) < SNAP_DISTANCE) {
        snappedX = frameCenterX;
        lines.push({ x: frameCenterX, type: 'vertical' });
      }
      
      // Vertical snapping
      if (Math.abs(y - frameTop) < SNAP_DISTANCE) {
        snappedY = frameTop;
        lines.push({ y: frameTop, type: 'horizontal' });
      }
      if (Math.abs(y - frameBottom) < SNAP_DISTANCE) {
        snappedY = frameBottom;
        lines.push({ y: frameBottom, type: 'horizontal' });
      }
      if (Math.abs(y - frameCenterY) < SNAP_DISTANCE) {
        snappedY = frameCenterY;
        lines.push({ y: frameCenterY, type: 'horizontal' });
      }
    });
    
    return { x: snappedX, y: snappedY, snapLines: lines };
  };

  const snapPosition = (x: number, y: number, excludeFrameId?: string): { x: number; y: number; snapLines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] } => {
    // First snap to grid
    let snappedX = snapToGrid(x);
    let snappedY = snapToGrid(y);
    
    // Then snap to other frames
    const frameSnap = snapToFrame(snappedX, snappedY, excludeFrameId);
    
    return frameSnap;
  };

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - use standard aspect ratios
    const width = 1200; // Standard flyer width
    const height = 800; // Standard flyer height (3:2 ratio)
    setCanvasSize({ width, height });
    canvas.width = width;
    canvas.height = height;

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
      setBackgroundImage(null);
      return;
    }

    setIsLoading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setBackgroundImage(img);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        toast.error('Failed to load background image');
        setIsLoading(false);
      };
      
      img.src = backgroundUrl;
    } catch (error) {
      console.error('Error loading background image:', error);
      setIsLoading(false);
    }
  }, [backgroundUrl]);

  useEffect(() => {
    loadBackgroundImage();
  }, [loadBackgroundImage]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom
    ctx.save();
    ctx.scale(zoom, zoom);

    // Draw grid (only when zoomed in enough)
    if (zoom > 0.5) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= canvasSize.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= canvasSize.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }

    // Draw background with aspect ratio preservation
    if (backgroundImage) {
      const imgAspectRatio = backgroundImage.width / backgroundImage.height;
      const canvasAspectRatio = canvasSize.width / canvasSize.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas - fit to width
        drawWidth = canvasSize.width;
        drawHeight = canvasSize.width / imgAspectRatio;
        drawX = 0;
        drawY = (canvasSize.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas - fit to height
        drawHeight = canvasSize.height;
        drawWidth = canvasSize.height * imgAspectRatio;
        drawX = (canvasSize.width - drawWidth) / 2;
        drawY = 0;
      }
      
      ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw frames
    frames.forEach(frame => {
      drawFrame(ctx, frame, frame.id === selectedFrameId);
    });

    // Draw snap lines
    if (snapLines.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      snapLines.forEach(line => {
        ctx.beginPath();
        if (line.type === 'vertical' && line.x !== undefined) {
          ctx.moveTo(line.x, 0);
          ctx.lineTo(line.x, canvasSize.height);
        } else if (line.type === 'horizontal' && line.y !== undefined) {
          ctx.moveTo(0, line.y);
          ctx.lineTo(canvasSize.width, line.y);
        }
        ctx.stroke();
      });
      
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [frames, selectedFrameId, backgroundImage, canvasSize, zoom]);

  // Draw a single frame
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    ctx.save();
    
    // Apply rotation
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((frame.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw frame based on shape
    switch (frame.shape) {
      case 'circle':
        drawCircleFrame(ctx, frame, isSelected);
        break;
      case 'rounded-rectangle':
        drawRoundedRectFrame(ctx, frame, isSelected);
        break;
      case 'polygon':
        drawPolygonFrame(ctx, frame, isSelected);
        break;
      default:
        drawRectangleFrame(ctx, frame, isSelected);
    }

    // Draw selection handles
    if (isSelected) {
      drawSelectionHandles(ctx, frame);
    }

    ctx.restore();
  }, []);

  // Draw rectangle frame
  const drawRectangleFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    
    // Draw placeholder content
    if (frame.type === 'text') {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        frame.properties?.placeholder || 'Text placeholder',
        frame.x + frame.width / 2,
        frame.y + frame.height / 2 + 5
      );
    } else {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      
      // Draw image icon
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📷', frame.x + frame.width / 2, frame.y + frame.height / 2 + 5);
    }
  }, []);

  // Draw circle frame
  const drawCircleFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const radius = Math.min(frame.width, frame.height) / 2;

    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw placeholder content
    if (frame.type === 'text') {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        frame.properties?.placeholder || 'Text',
        centerX,
        centerY + 5
      );
    } else {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📷', centerX, centerY + 5);
    }
  }, []);

  // Draw rounded rectangle frame
  const drawRoundedRectFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const radius = frame.cornerRadius || 10;
    
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(frame.x + radius, frame.y);
    ctx.lineTo(frame.x + frame.width - radius, frame.y);
    ctx.quadraticCurveTo(frame.x + frame.width, frame.y, frame.x + frame.width, frame.y + radius);
    ctx.lineTo(frame.x + frame.width, frame.y + frame.height - radius);
    ctx.quadraticCurveTo(frame.x + frame.width, frame.y + frame.height, frame.x + frame.width - radius, frame.y + frame.height);
    ctx.lineTo(frame.x + radius, frame.y + frame.height);
    ctx.quadraticCurveTo(frame.x, frame.y + frame.height, frame.x, frame.y + frame.height - radius);
    ctx.lineTo(frame.x, frame.y + radius);
    ctx.quadraticCurveTo(frame.x, frame.y, frame.x + radius, frame.y);
    ctx.closePath();
    ctx.stroke();

    // Draw placeholder content
    if (frame.type === 'text') {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        frame.properties?.placeholder || 'Text placeholder',
        frame.x + frame.width / 2,
        frame.y + frame.height / 2 + 5
      );
    } else {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📷', frame.x + frame.width / 2, frame.y + frame.height / 2 + 5);
    }
  }, []);

  // Draw polygon frame
  const drawPolygonFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const points = frame.points || [
      [0, 0], [frame.width, 0], [frame.width, frame.height], [0, frame.height]
    ];
    
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = frame.x + point[0];
      const y = frame.y + point[1];
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // Draw placeholder content
    if (frame.type === 'text') {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        frame.properties?.placeholder || 'Text',
        frame.x + frame.width / 2,
        frame.y + frame.height / 2 + 5
      );
    } else {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📷', frame.x + frame.width / 2, frame.y + frame.height / 2 + 5);
    }
  }, []);

  // Draw selection handles
  const drawSelectionHandles = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData) => {
    const handles = [
      { x: frame.x, y: frame.y, cursor: 'nw-resize' }, // Top-left
      { x: frame.x + frame.width / 2, y: frame.y, cursor: 'n-resize' }, // Top
      { x: frame.x + frame.width, y: frame.y, cursor: 'ne-resize' }, // Top-right
      { x: frame.x + frame.width, y: frame.y + frame.height / 2, cursor: 'e-resize' }, // Right
      { x: frame.x + frame.width, y: frame.y + frame.height, cursor: 'se-resize' }, // Bottom-right
      { x: frame.x + frame.width / 2, y: frame.y + frame.height, cursor: 's-resize' }, // Bottom
      { x: frame.x, y: frame.y + frame.height, cursor: 'sw-resize' }, // Bottom-left
      { x: frame.x, y: frame.y + frame.height / 2, cursor: 'w-resize' }, // Left
    ];

    handles.forEach(handle => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, RESIZE_HANDLE_SIZE / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw rotation handle
    const rotationHandleY = frame.y - ROTATION_HANDLE_DISTANCE;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(frame.x + frame.width / 2, rotationHandleY, RESIZE_HANDLE_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw rotation line
    ctx.strokeStyle = '#3b82f6';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(frame.x + frame.width / 2, frame.y);
    ctx.lineTo(frame.x + frame.width / 2, rotationHandleY);
    ctx.stroke();
  }, []);

  // Mouse event handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    return { x, y };
  }, [zoom]);

  const getFrameAtPosition = useCallback((x: number, y: number): FrameData | null => {
    // Check frames in reverse order (top to bottom)
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      if (x >= frame.x && x <= frame.x + frame.width &&
          y >= frame.y && y <= frame.y + frame.height) {
        return frame;
      }
    }
    return null;
  }, [frames]);

  const getResizeHandle = useCallback((x: number, y: number, frame: FrameData): string | null => {
    if (!selectedFrame) return null;

    const handles = [
      { x: frame.x, y: frame.y, handle: 'nw' },
      { x: frame.x + frame.width / 2, y: frame.y, handle: 'n' },
      { x: frame.x + frame.width, y: frame.y, handle: 'ne' },
      { x: frame.x + frame.width, y: frame.y + frame.height / 2, handle: 'e' },
      { x: frame.x + frame.width, y: frame.y + frame.height, handle: 'se' },
      { x: frame.x + frame.width / 2, y: frame.y + frame.height, handle: 's' },
      { x: frame.x, y: frame.y + frame.height, handle: 'sw' },
      { x: frame.x, y: frame.y + frame.height / 2, handle: 'w' },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
      if (distance <= RESIZE_HANDLE_SIZE) {
        return handle.handle;
      }
    }

    // Check rotation handle
    const rotationHandleY = frame.y - ROTATION_HANDLE_DISTANCE;
    const rotationDistance = Math.sqrt((x - (frame.x + frame.width / 2)) ** 2 + (y - rotationHandleY) ** 2);
    if (rotationDistance <= RESIZE_HANDLE_SIZE) {
      return 'rotate';
    }

    return null;
  }, [selectedFrame]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);
    const frame = getFrameAtPosition(x, y);
    
    if (frame) {
      const resizeHandle = getResizeHandle(x, y, frame);
      
      if (resizeHandle === 'rotate') {
        setDragState({
          isDragging: false,
          isResizing: false,
          isRotating: true,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: null,
        });
      } else if (resizeHandle) {
        setDragState({
          isDragging: false,
          isResizing: true,
          isRotating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: resizeHandle as any,
        });
      } else {
        setDragState({
          isDragging: true,
          isResizing: false,
          isRotating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: null,
        });
      }
      
      onFrameSelect(frame.id);
    } else {
      onFrameSelect(null);
    }
  }, [getMousePos, getFrameAtPosition, getResizeHandle, onFrameSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing && !dragState.isRotating) {
      // Update cursor
      const { x, y } = getMousePos(e);
      const frame = getFrameAtPosition(x, y);
      
      if (frame && frame.id === selectedFrameId) {
        const resizeHandle = getResizeHandle(x, y, frame);
        if (resizeHandle === 'rotate') {
          canvasRef.current!.style.cursor = 'grab';
        } else if (resizeHandle) {
          canvasRef.current!.style.cursor = `${resizeHandle}-resize`;
        } else {
          canvasRef.current!.style.cursor = 'move';
        }
      } else {
        canvasRef.current!.style.cursor = 'default';
      }
      return;
    }

    const { x, y } = getMousePos(e);
    const deltaX = x - dragState.startX;
    const deltaY = y - dragState.startY;

    if (!dragState.startFrame) return;

    const updatedFrames = frames.map(f => {
      if (f.id !== dragState.startFrame!.id) return f;

      const newFrame = { ...f };

      if (dragState.isDragging) {
        const newX = dragState.startFrame!.x + deltaX;
        const newY = dragState.startFrame!.y + deltaY;
        
        // Apply snapping
        const snapped = snapPosition(newX, newY, f.id);
        newFrame.x = snapped.x;
        newFrame.y = snapped.y;
        
        // Update snap lines for visual feedback
        setSnapLines(snapped.snapLines);
      } else if (dragState.isResizing) {
        const handle = dragState.resizeHandle;
        if (handle?.includes('e')) {
          newFrame.width = Math.max(20, dragState.startFrame!.width + deltaX);
        }
        if (handle?.includes('w')) {
          const newWidth = Math.max(20, dragState.startFrame!.width - deltaX);
          newFrame.x = dragState.startFrame!.x + dragState.startFrame!.width - newWidth;
          newFrame.width = newWidth;
        }
        if (handle?.includes('s')) {
          newFrame.height = Math.max(20, dragState.startFrame!.height + deltaY);
        }
        if (handle?.includes('n')) {
          const newHeight = Math.max(20, dragState.startFrame!.height - deltaY);
          newFrame.y = dragState.startFrame!.y + dragState.startFrame!.height - newHeight;
          newFrame.height = newHeight;
        }
      } else if (dragState.isRotating) {
        const centerX = dragState.startFrame!.x + dragState.startFrame!.width / 2;
        const centerY = dragState.startFrame!.y + dragState.startFrame!.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        newFrame.rotation = angle;
      }

      return newFrame;
    });

    onFramesChange(updatedFrames);
  }, [dragState, getMousePos, frames, selectedFrameId, getFrameAtPosition, getResizeHandle, onFramesChange]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      isRotating: false,
      startX: 0,
      startY: 0,
      startFrame: null,
      resizeHandle: null,
    });
    setSnapLines([]); // Clear snap lines when dragging stops
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFrame || readOnly) return;

      const step = e.shiftKey ? 10 : 1;
      const rotationStep = e.shiftKey ? 15 : 5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          const newX = selectedFrame.x - step;
          const snappedX = snapToGrid(newX);
          updateFrame({ x: snappedX });
          break;
        case 'ArrowRight':
          e.preventDefault();
          const newXRight = selectedFrame.x + step;
          const snappedXRight = snapToGrid(newXRight);
          updateFrame({ x: snappedXRight });
          break;
        case 'ArrowUp':
          e.preventDefault();
          const newY = selectedFrame.y - step;
          const snappedY = snapToGrid(newY);
          updateFrame({ y: snappedY });
          break;
        case 'ArrowDown':
          e.preventDefault();
          const newYDown = selectedFrame.y + step;
          const snappedYDown = snapToGrid(newYDown);
          updateFrame({ y: snappedYDown });
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          onFrameSelect(null);
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            updateFrame({ rotation: selectedFrame.rotation + rotationStep });
          }
          break;
        case 'Escape':
          onFrameSelect(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFrame, onFrameSelect]);

  const updateFrame = (updates: Partial<FrameData>) => {
    if (!selectedFrame || readOnly || !onFramesChange) return;
    
    const updatedFrames = frames.map(f => 
      f.id === selectedFrame.id ? { ...f, ...updates } : f
    );
    onFramesChange(updatedFrames);
  };

  // Render canvas when frames or selection changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Export functionality
  const handleExport = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'template.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Read-only indicator */}
      {readOnly && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
          Read Only
        </div>
      )}
      
      {/* Canvas Container */}
      <div className="relative bg-gray-100">
        <canvas
          ref={canvasRef}
          className="block cursor-default"
          onMouseDown={readOnly ? undefined : handleMouseDown}
          onMouseMove={readOnly ? undefined : handleMouseMove}
          onMouseUp={readOnly ? undefined : handleMouseUp}
          onMouseLeave={readOnly ? undefined : handleMouseUp}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            <span className="hidden sm:inline">Arrow keys: Move • Ctrl+R: Rotate • Delete: Deselect</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  );
} 