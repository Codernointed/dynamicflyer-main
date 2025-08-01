/**
 * Enhanced Canvas Editor Component
 * Intuitive and powerful HTML5 Canvas-based editor with seamless frame creation
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ZoomIn, ZoomOut, RotateCcw, Download, Move, Square, Circle, Type, Image as ImageIcon, Plus, Trash2, Grid3X3, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { drawBackgroundImage } from '@/lib/imageUtils';

export interface FrameData {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'rounded-rectangle' | 'polygon';
  cornerRadius?: number;
  polygonSides?: number; // Number of sides for polygon (6 = hexagon, 8 = octagon, etc.)
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
  isCreating: boolean;
  startX: number;
  startY: number;
  startFrame: FrameData | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
  createType: 'image' | 'text' | null;
  createShape: 'rectangle' | 'circle' | 'rounded-rectangle';
}

const RESIZE_HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 30;
const SNAP_THRESHOLD = 10;
const GRID_SIZE = 10;
const SNAP_DISTANCE = 10;
const MIN_FRAME_SIZE = 30;

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
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    isCreating: false,
    startX: 0,
    startY: 0,
    startFrame: null,
    resizeHandle: null,
    createType: null,
    createShape: 'rectangle',
  });
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number; type: 'horizontal' | 'vertical' }[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [fineGrid, setFineGrid] = useState(false);
  const [rotationInput, setRotationInput] = useState<string>('');

  const selectedFrame = useMemo(() => 
    frames.find(f => f.id === selectedFrameId) || null, 
    [frames, selectedFrameId]
  );

  // Update rotation input when selected frame changes
  useEffect(() => {
    if (selectedFrame) {
      setRotationInput(selectedFrame.rotation.toString());
    } else {
      setRotationInput('');
    }
  }, [selectedFrame]);

  // Snap functions
  const snapToGrid = (value: number): number => {
    const currentGridSize = fineGrid ? 5 : GRID_SIZE;
    return Math.round(value / currentGridSize) * currentGridSize;
  };

  const snapToFrame = (x: number, y: number, excludeFrameId?: string): { x: number; y: number; snapLines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] } => {
    let snappedX = x;
    let snappedY = y;
    const lines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] = [];
    
    frames.forEach(frame => {
      if (frame.id === excludeFrameId) return;
      
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
    let snappedX = snapToGrid(x);
    let snappedY = snapToGrid(y);
    
    const frameSnap = snapToFrame(snappedX, snappedY, excludeFrameId);
    
    return frameSnap;
  };

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - preserve aspect ratio of background
    const width = 1200;
    const height = 800;
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

    // Draw grid
    if (showGrid && zoom > 0.5) {
      const currentGridSize = fineGrid ? 5 : GRID_SIZE;
      ctx.strokeStyle = fineGrid ? '#f3f4f6' : '#e5e7eb';
      ctx.lineWidth = fineGrid ? 0.5 : 1;
      
      for (let x = 0; x <= canvasSize.width; x += currentGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvasSize.height; y += currentGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }

    // Draw background
    if (backgroundImage) {
      drawBackgroundImage(ctx, backgroundImage, canvasSize.width, canvasSize.height);
    } else {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw frames
    frames.forEach(frame => {
      drawFrame(ctx, frame, frame.id === selectedFrameId);
    });

    // Draw snap lines
    if (showGuides && snapLines.length > 0) {
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
  }, [frames, selectedFrameId, backgroundImage, canvasSize, zoom, showGrid, showGuides, snapLines, fineGrid]);

  // Draw a single frame
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    ctx.save();
    
    // Calculate the rotated bounding box to ensure no spaces
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    // Calculate the corners of the original rectangle
    const corners = [
      { x: frame.x, y: frame.y },
      { x: frame.x + frame.width, y: frame.y },
      { x: frame.x + frame.width, y: frame.y + frame.height },
      { x: frame.x, y: frame.y + frame.height }
    ];
    
    // Rotate the corners
    const rotatedCorners = corners.map(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad),
        y: centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad)
      };
    });
    
    // Find the bounding box of the rotated rectangle
    const minX = Math.min(...rotatedCorners.map(c => c.x));
    const maxX = Math.max(...rotatedCorners.map(c => c.x));
    const minY = Math.min(...rotatedCorners.map(c => c.y));
    const maxY = Math.max(...rotatedCorners.map(c => c.y));
    
    // Create a clipping path for the rotated frame
    ctx.beginPath();
    rotatedCorners.forEach((corner, index) => {
      if (index === 0) {
        ctx.moveTo(corner.x, corner.y);
      } else {
        ctx.lineTo(corner.x, corner.y);
      }
    });
    ctx.closePath();
    ctx.clip();
    
    // Draw the content (image/text) WITHOUT rotation - always upright
    if (frame.type === 'text') {
      drawTextContent(ctx, frame, isSelected);
    } else {
      drawImageContent(ctx, frame, isSelected);
    }
    
    ctx.restore();
    
    // Draw the rotated frame border
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.translate(-centerX, -centerY);
    
    // Draw frame border based on shape
    switch (frame.shape) {
      case 'circle':
        drawCircleFrameBorder(ctx, frame, isSelected);
        break;
      case 'rounded-rectangle':
        drawRoundedRectFrameBorder(ctx, frame, isSelected);
        break;
      case 'polygon':
        drawPolygonFrameBorder(ctx, frame, isSelected);
        break;
      default:
        drawRectangleFrameBorder(ctx, frame, isSelected);
    }
    
    ctx.restore();
    
    // Draw selection handles (also rotated)
    if (isSelected) {
      drawSelectionHandles(ctx, frame);
    }
  }, []);

  // Draw text content (always upright)
  const drawTextContent = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    // The content is already clipped to the rotated frame bounds
    // Just draw the text in the center of the original frame coordinates
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      frame.properties?.placeholder || 'Text placeholder',
      frame.x + frame.width / 2,
      frame.y + frame.height / 2 + 5
    );
  }, []);

  // Draw image content (always upright)
  const drawImageContent = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    // The content is already clipped to the rotated frame bounds
    // Fill the entire frame area and draw the icon in the center
    ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    
    // Draw image icon
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', frame.x + frame.width / 2, frame.y + frame.height / 2 + 5);
  }, []);

  // Draw rectangle frame border (rotated)
  const drawRectangleFrameBorder = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  }, []);

  // Draw circle frame border (rotated)
  const drawCircleFrameBorder = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const radius = Math.min(frame.width, frame.height) / 2;

    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }, []);

  // Draw rounded rectangle frame border (rotated)
  const drawRoundedRectFrameBorder = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
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
  }, []);

  // Draw polygon frame border (rotated)
  const drawPolygonFrameBorder = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const sides = frame.polygonSides || 6; // Default to hexagon
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const radius = Math.min(frame.width, frame.height) / 2;
    
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    // Draw polygon
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }, []);

  // Draw selection handles
  const drawSelectionHandles = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData) => {
    const handles = [
      { x: frame.x, y: frame.y, cursor: 'nw-resize' },
      { x: frame.x + frame.width / 2, y: frame.y, cursor: 'n-resize' },
      { x: frame.x + frame.width, y: frame.y, cursor: 'ne-resize' },
      { x: frame.x + frame.width, y: frame.y + frame.height / 2, cursor: 'e-resize' },
      { x: frame.x + frame.width, y: frame.y + frame.height, cursor: 'se-resize' },
      { x: frame.x + frame.width / 2, y: frame.y + frame.height, cursor: 's-resize' },
      { x: frame.x, y: frame.y + frame.height, cursor: 'sw-resize' },
      { x: frame.x, y: frame.y + frame.height / 2, cursor: 'w-resize' },
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
    if (readOnly) return;
    
    const { x, y } = getMousePos(e);
    const frame = getFrameAtPosition(x, y);
    
    if (frame) {
      const resizeHandle = getResizeHandle(x, y, frame);
      
      if (resizeHandle === 'rotate') {
        setDragState({
          isDragging: false,
          isResizing: false,
          isRotating: true,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: null,
          createType: null,
          createShape: 'rectangle',
        });
      } else if (resizeHandle) {
        setDragState({
          isDragging: false,
          isResizing: true,
          isRotating: false,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: resizeHandle as any,
          createType: null,
          createShape: 'rectangle',
        });
      } else {
        setDragState({
          isDragging: true,
          isResizing: false,
          isRotating: false,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          resizeHandle: null,
          createType: null,
          createShape: 'rectangle',
        });
      }
      
      onFrameSelect(frame.id);
    } else {
      onFrameSelect(null);
    }
  }, [getMousePos, getFrameAtPosition, getResizeHandle, onFrameSelect, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing && !dragState.isRotating && !dragState.isCreating) {
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
        
        const snapped = snapPosition(newX, newY, f.id);
        newFrame.x = snapped.x;
        newFrame.y = snapped.y;
        
        setSnapLines(snapped.snapLines);
      } else if (dragState.isResizing) {
        const handle = dragState.resizeHandle;
        if (handle?.includes('e')) {
          newFrame.width = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.width + deltaX);
        }
        if (handle?.includes('w')) {
          const newWidth = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.width - deltaX);
          newFrame.x = dragState.startFrame!.x + dragState.startFrame!.width - newWidth;
          newFrame.width = newWidth;
        }
        if (handle?.includes('s')) {
          newFrame.height = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.height + deltaY);
        }
        if (handle?.includes('n')) {
          const newHeight = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.height - deltaY);
          newFrame.y = dragState.startFrame!.y + dragState.startFrame!.height - newHeight;
          newFrame.height = newHeight;
        }
      } else if (dragState.isRotating) {
        const centerX = dragState.startFrame!.x + dragState.startFrame!.width / 2;
        const centerY = dragState.startFrame!.y + dragState.startFrame!.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        // Normalize angle to 0-360 range
        let normalizedAngle = angle;
        while (normalizedAngle < 0) normalizedAngle += 360;
        while (normalizedAngle >= 360) normalizedAngle -= 360;
        newFrame.rotation = normalizedAngle;
        setRotationInput(normalizedAngle.toString());
      }

      return newFrame;
    });

    onFramesChange?.(updatedFrames);
  }, [dragState, getMousePos, frames, selectedFrameId, getFrameAtPosition, getResizeHandle, onFramesChange]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      isRotating: false,
      isCreating: false,
      startX: 0,
      startY: 0,
      startFrame: null,
      resizeHandle: null,
      createType: null,
      createShape: 'rectangle',
    });
    setSnapLines([]);
  }, []);

  // Quick frame creation
  const createFrame = useCallback((type: 'image' | 'text', shape: 'rectangle' | 'circle' | 'rounded-rectangle' = 'rectangle') => {
    if (!onFramesChange) return;

    const newFrame: FrameData = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 100 + frames.length * 20,
      y: 100 + frames.length * 20,
      width: type === 'image' ? 200 : 300,
      height: type === 'image' ? 200 : 80,
      rotation: 0,
      shape,
      cornerRadius: shape === 'rounded-rectangle' ? 10 : undefined,
      properties: type === 'text' ? {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'center',
        placeholder: 'Enter your text here',
      } : undefined,
    };

    const updatedFrames = [...frames, newFrame];
    onFramesChange(updatedFrames);
    onFrameSelect(newFrame.id);
    
    toast.success(`${type === 'image' ? 'Image' : 'Text'} frame created!`);
  }, [frames, onFramesChange, onFrameSelect]);

  // Delete selected frame
  const deleteSelectedFrame = useCallback(() => {
    if (!selectedFrame || !onFramesChange) return;

    const updatedFrames = frames.filter(f => f.id !== selectedFrame.id);
    onFramesChange(updatedFrames);
    onFrameSelect(null);
    
    toast.success('Frame deleted');
  }, [selectedFrame, frames, onFramesChange, onFrameSelect]);

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
          deleteSelectedFrame();
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const newRotation = selectedFrame.rotation + rotationStep;
            updateFrame({ rotation: newRotation });
            setRotationInput(newRotation.toString());
          }
          break;
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const newRotation = selectedFrame.rotation - rotationStep;
            updateFrame({ rotation: newRotation });
            setRotationInput(newRotation.toString());
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            updateFrame({ rotation: 0 });
            setRotationInput('0');
          }
          break;
        case 'Escape':
          onFrameSelect(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFrame, onFrameSelect, readOnly]);

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

  // Rotation controls
  const handleRotationInputChange = (value: string) => {
    setRotationInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && selectedFrame) {
      updateFrame({ rotation: numValue });
    }
  };

  const handleRotationInputBlur = () => {
    if (selectedFrame) {
      const numValue = parseFloat(rotationInput);
      if (!isNaN(numValue)) {
        updateFrame({ rotation: numValue });
      } else {
        setRotationInput(selectedFrame.rotation.toString());
      }
    }
  };

  const handleRotationUp = () => {
    if (selectedFrame) {
      const newRotation = selectedFrame.rotation + 5;
      updateFrame({ rotation: newRotation });
      setRotationInput(newRotation.toString());
    }
  };

  const handleRotationDown = () => {
    if (selectedFrame) {
      const newRotation = selectedFrame.rotation - 5;
      updateFrame({ rotation: newRotation });
      setRotationInput(newRotation.toString());
    }
  };

  const handleRotationReset = () => {
    if (selectedFrame) {
      updateFrame({ rotation: 0 });
      setRotationInput('0');
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Read-only indicator */}
      {readOnly && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
          Read Only
        </div>
      )}
      
      {/* Quick Actions Toolbar */}
      {!readOnly && (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => createFrame('image', 'rectangle')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Add Image
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => createFrame('text', 'rectangle')}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Type className="h-4 w-4 mr-1" />
            Add Text
          </Button>
          {selectedFrame && (
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteSelectedFrame}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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

          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          
          <Button
            variant={fineGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setFineGrid(!fineGrid)}
            disabled={!showGrid}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />
          
          {/* Rotation Controls */}
          {selectedFrame && !readOnly && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 whitespace-nowrap">Rotation:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotationDown}
                className="h-7 w-7 p-0"
              >
                ↓
              </Button>
              <input
                type="number"
                value={rotationInput}
                onChange={(e) => handleRotationInputChange(e.target.value)}
                onBlur={handleRotationInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 h-7 text-center text-sm border border-gray-300 rounded px-1"
                placeholder="0"
                step="1"
                min="-360"
                max="360"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotationUp}
                className="h-7 w-7 p-0"
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotationReset}
                className="h-7 px-2 text-xs"
                title="Reset rotation"
              >
                0°
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            <span className="hidden sm:inline">Arrow keys: Move • Ctrl+R: Rotate • Ctrl+Shift+R: Rotate CCW • Ctrl+0: Reset • Delete: Remove</span>
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