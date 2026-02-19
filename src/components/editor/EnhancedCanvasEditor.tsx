/**
 * Enhanced Canvas Editor Component
 * Intuitive and powerful HTML5 Canvas-based editor with seamless frame creation
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ZoomIn, ZoomOut, RotateCcw, Download, Move, Square, Circle, Type, Image as ImageIcon, Plus, Trash2, Grid3X3, Eye, EyeOff, Hand, MousePointer2, Copy, Lock, Unlock, ChevronUp, ChevronDown, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';
import { drawBackgroundImage } from '@/lib/imageUtils';
import { FeatureGate } from '@/components/shared/FeatureGate';

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
  visible?: boolean;
  locked?: boolean;
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
  onFramesChangeEnd?: (frames: FrameData[]) => void;
  onFrameSelect: (frameId: string | null) => void;
  onCanvasReady: (ready: boolean) => void;
  readOnly?: boolean;
  externalZoom?: number;
  onZoomChange?: (zoom: number) => void;
  interactionMode?: 'select' | 'pan';
  onInteractionModeChange?: (mode: 'select' | 'pan') => void;
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
  showGuides?: boolean;
  onShowGuidesChange?: (show: boolean) => void;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  isPanning: boolean;
  isCreating: boolean;
  startX: number;
  startY: number;
  startFrame: FrameData | null;
  startPan: { x: number; y: number } | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
  createType: 'image' | 'text' | null;
  createShape: 'rectangle' | 'circle' | 'rounded-rectangle';
}

const RESIZE_HANDLE_BASE_SIZE = 8;
const ROTATION_HANDLE_BASE_DISTANCE = 30;
const SNAP_THRESHOLD = 10;
const GRID_SIZE = 10;
const SNAP_DISTANCE = 10;
const MIN_FRAME_SIZE = 30;

export default function EnhancedCanvasEditor({
  backgroundUrl,
  frames,
  selectedFrameId,
  onFramesChange,
  onFramesChangeEnd,
  onFrameSelect,
  onCanvasReady,
  readOnly = false,
  externalZoom,
  onZoomChange,
  interactionMode: externalInteractionMode,
  onInteractionModeChange,
  showGrid: externalShowGrid,
  onShowGridChange,
  showGuides: externalShowGuides,
  onShowGuidesChange,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setInternalZoom] = useState(1);
  
  // Sync internal zoom with external if provided
  useEffect(() => {
    if (externalZoom !== undefined && externalZoom !== zoom) {
      setInternalZoom(externalZoom);
    }
  }, [externalZoom]);

  const setZoom = useCallback((newZoom: number | ((prev: number) => number)) => {
    setInternalZoom(prev => {
      const updated = typeof newZoom === 'function' ? newZoom(prev) : newZoom;
      onZoomChange?.(updated);
      return updated;
    });
  }, [onZoomChange]);
  const [displayScale, setDisplayScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

  const [internalInteractionMode, setInternalInteractionMode] = useState<'select' | 'pan'>('select');
  const interactionMode = externalInteractionMode !== undefined ? externalInteractionMode : internalInteractionMode;
  
  const setInteractionMode = useCallback((mode: 'select' | 'pan') => {
    setInternalInteractionMode(mode);
    onInteractionModeChange?.(mode);
  }, [onInteractionModeChange]);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    isPanning: false,
    isCreating: false,
    startX: 0,
    startY: 0,
    startFrame: null,
    startPan: null,
    resizeHandle: null,
    createType: null,
    createShape: 'rectangle',
  });
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number; type: 'horizontal' | 'vertical' }[]>([]);
  const [internalShowGrid, setInternalShowGrid] = useState(false);
  const showGrid = externalShowGrid !== undefined ? externalShowGrid : internalShowGrid;
  
  const [internalShowGuides, setInternalShowGuides] = useState(true);
  const showGuides = externalShowGuides !== undefined ? externalShowGuides : internalShowGuides;
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

  const snapToFrame = (x: number, y: number, width: number, height: number, excludeFrameId?: string): { x: number; y: number; snapLines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] } => {
    let snappedX = x;
    let snappedY = y;
    const lines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] = [];
    
    // Bounds of the frame being dragged
    const dragLeft = x;
    const dragRight = x + width;
    const dragTop = y;
    const dragBottom = y + height;
    const dragCenterX = x + width / 2;
    const dragCenterY = y + height / 2;

    frames.forEach(frame => {
      if (frame.id === excludeFrameId || frame.visible === false) return;
      
      const fLeft = frame.x;
      const fRight = frame.x + frame.width;
      const fTop = frame.y;
      const fBottom = frame.y + frame.height;
      const fCenterX = frame.x + frame.width / 2;
      const fCenterY = frame.y + frame.height / 2;
      
      // Vertical Snapping (X axis)
      const xSnapPoints = [
        { v: fLeft, label: 'left' },
        { v: fRight, label: 'right' },
        { v: fCenterX, label: 'center' }
      ];
      const dragXPoints = [
        { v: dragLeft, offset: 0 },
        { v: dragRight, offset: -width },
        { v: dragCenterX, offset: -width / 2 }
      ];

      for (const fPoint of xSnapPoints) {
        for (const dPoint of dragXPoints) {
          if (Math.abs(dPoint.v - fPoint.v) < SNAP_THRESHOLD) {
            snappedX = fPoint.v + dPoint.offset;
            lines.push({ x: fPoint.v, type: 'vertical' });
          }
        }
      }

      // Horizontal Snapping (Y axis)
      const ySnapPoints = [
        { v: fTop, label: 'top' },
        { v: fBottom, label: 'bottom' },
        { v: fCenterY, label: 'center' }
      ];
      const dragYPoints = [
        { v: dragTop, offset: 0 },
        { v: dragBottom, offset: -height },
        { v: dragCenterY, offset: -height / 2 }
      ];

      for (const fPoint of ySnapPoints) {
        for (const dPoint of dragYPoints) {
          if (Math.abs(dPoint.v - fPoint.v) < SNAP_THRESHOLD) {
            snappedY = fPoint.v + dPoint.offset;
            lines.push({ y: fPoint.v, type: 'horizontal' });
          }
        }
      }
    });

    // Canvas Center Snapping
    if (Math.abs(dragCenterX - canvasSize.width / 2) < SNAP_THRESHOLD) {
      snappedX = canvasSize.width / 2 - width / 2;
      lines.push({ x: canvasSize.width / 2, type: 'vertical' });
    }
    if (Math.abs(dragCenterY - canvasSize.height / 2) < SNAP_THRESHOLD) {
      snappedY = canvasSize.height / 2 - height / 2;
      lines.push({ y: canvasSize.height / 2, type: 'horizontal' });
    }
    
    return { x: snappedX, y: snappedY, snapLines: lines };
  };

  const snapPosition = (x: number, y: number, width: number, height: number, excludeFrameId?: string, useGrid: boolean = true): { x: number; y: number; snapLines: { x?: number; y?: number; type: 'horizontal' | 'vertical' }[] } => {
    let snappedX = x;
    let snappedY = y;
    
    // Only apply grid snapping if enabled and useGrid is true
    if (showGrid && useGrid) {
      snappedX = snapToGrid(x);
      snappedY = snapToGrid(y);
    }
    
    const frameSnap = snapToFrame(snappedX, snappedY, width, height, excludeFrameId);
    
    return frameSnap;
  };

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal template dimensions
    const baseWidth = 1200;
    const baseHeight = 800;
    setCanvasSize({ width: baseWidth, height: baseHeight });

    // Account for High-DPI displays (mobile, retina)
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal resolution
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;

    // Scale context to match DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    onCanvasReady(true);
    setIsLoading(false);
    renderCanvas();
  }, [onCanvasReady]);

  // Handle container resizing for responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      
      // Safety guard: ignore tiny or zero dimensions which occur during transitions or initial loads
      if (width < 100 || height < 100) return;

      // Calculate scale to fit 1200x800 in the available space with padding
      const padding = 64; 
      const scaleX = (width - padding) / 1200;
      const scaleY = (height - padding) / 800;
      
      // Use the smaller scale to ensure it fits both ways and preserves aspect ratio
      // Set a minimum floor (0.2) to prevent the "tiny dot" issue at low resolutions
      const newScale = Math.max(0.2, Math.min(scaleX, scaleY, 1)); 
      setDisplayScale(newScale);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

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

    // Apply viewport transformations
    ctx.save();
    // Note: Internal scaling is now handled by the container DIV's CSS transform or width/height
    // We only apply internal panning offset here
    ctx.translate(panOffset.x, panOffset.y);

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
    [...frames].forEach((frame, index) => {
      if (frame.visible === false) return;
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
  }, [frames, selectedFrameId, backgroundImage, canvasSize, zoom, panOffset, showGrid, showGuides, snapLines, fineGrid]);

  // Trigger render on any state change that affects the canvas visual
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Draw a single frame
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    // Draw the rotated frame border first
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
    
    // Draw content in rotated coordinate system
    if (frame.type === 'text') {
      drawTextContent(ctx, frame, isSelected);
    } else {
      drawImageContent(ctx, frame, isSelected);
    }
    
    // Draw selection handles (also rotated)
    if (isSelected) {
      drawSelectionHandles(ctx, frame);
    }
  }, []);

  // Draw text content (rotated with frame)
  const drawTextContent = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.translate(-centerX, -centerY);
    
    // Fill the frame area with background
    ctx.fillStyle = 'rgba(156, 163, 175, 0.1)';
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    
    // Draw the text in the center of the frame coordinates
    ctx.fillStyle = frame.properties?.color || '#9ca3af';
    ctx.font = `${frame.properties?.fontSize || 16}px ${frame.properties?.fontFamily || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      frame.properties?.placeholder || 'Text placeholder',
      frame.x + frame.width / 2,
      frame.y + frame.height / 2 + 5
    );
    
    ctx.restore();
  }, []);

  // Draw image content (rotated with frame)
  const drawImageContent = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData, isSelected: boolean) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.translate(-centerX, -centerY);
    
    // Fill the frame area with background
    ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    
    // Draw image icon in the center
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', frame.x + frame.width / 2, frame.y + frame.height / 2 + 5);
    
    ctx.restore();
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

  // Draw selection handles (rotated with frame)
  const drawSelectionHandles = useCallback((ctx: CanvasRenderingContext2D, frame: FrameData) => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    // Calculate handle sizes (RESIZE_HANDLE_BASE_SIZE is already in px)
    const handleSize = RESIZE_HANDLE_BASE_SIZE;
    const rotationDistance = ROTATION_HANDLE_BASE_DISTANCE;
    
    // Calculate rotated handle positions
    const getRotatedPosition = (x: number, y: number) => {
      const dx = x - centerX;
      const dy = y - centerY;
      return {
        x: centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad),
        y: centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad)
      };
    };
    
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

    // Draw rotated handles
    handles.forEach(handle => {
      const rotatedPos = getRotatedPosition(handle.x, handle.y);
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      ctx.arc(rotatedPos.x, rotatedPos.y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw rotation handle (also rotated)
    const rotationHandleY = frame.y - rotationDistance;
    const rotationHandlePos = getRotatedPosition(frame.x + frame.width / 2, rotationHandleY);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(rotationHandlePos.x, rotationHandlePos.y, handleSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw rotation line (rotated)
    const topCenterPos = getRotatedPosition(frame.x + frame.width / 2, frame.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(topCenterPos.x, topCenterPos.y);
    ctx.lineTo(rotationHandlePos.x, rotationHandlePos.y);
    ctx.stroke();
  }, [zoom]);

  // Mouse event handlers
  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Maps screen pixels directly to internal 1200x800 coordinate system
    // The current scale on screen is (displayScale * zoom)
    const currentScale = displayScale * zoom;
    const x = (e.clientX - rect.left) / currentScale - panOffset.x;
    const y = (e.clientY - rect.top) / currentScale - panOffset.y;
    
    return { x, y };
  }, [displayScale, zoom, panOffset]);

  const getFrameAtPosition = useCallback((x: number, y: number): FrameData | null => {
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      // Don't select hidden or locked frames
      if (frame.visible === false || frame.locked === true) continue;
      
      // Check if point is inside the rotated frame
      const centerX = frame.x + frame.width / 2;
      const centerY = frame.y + frame.height / 2;
      const rotationRad = (frame.rotation * Math.PI) / 180;
      
      // Transform point to frame's coordinate system
      const dx = x - centerX;
      const dy = y - centerY;
      const rotatedX = dx * Math.cos(-rotationRad) - dy * Math.sin(-rotationRad);
      const rotatedY = dx * Math.sin(-rotationRad) + dy * Math.cos(-rotationRad);
      
      // Check if transformed point is inside the frame bounds
      if (rotatedX >= -frame.width / 2 && rotatedX <= frame.width / 2 &&
          rotatedY >= -frame.height / 2 && rotatedY <= frame.height / 2) {
        return frame;
      }
    }
    return null;
  }, [frames]);

  const getResizeHandle = useCallback((x: number, y: number, frame: FrameData): string | null => {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const rotationRad = (frame.rotation * Math.PI) / 180;
    
    // Calculate rotated handle positions
    const getRotatedPosition = (x: number, y: number) => {
      const dx = x - centerX;
      const dy = y - centerY;
      return {
        x: centerX + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad),
        y: centerY + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad)
      };
    };
    
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

    // Check rotated handles
    const hitSize = RESIZE_HANDLE_BASE_SIZE;
    for (const handle of handles) {
      const rotatedPos = getRotatedPosition(handle.x, handle.y);
      const dist = Math.sqrt((x - rotatedPos.x) ** 2 + (y - rotatedPos.y) ** 2);
      if (dist <= hitSize / 2 + 5) { // Adding a small buffer for easier hit testing
        return handle.handle;
      }
    }

    // Check rotation handle (also rotated)
    const rotDist = ROTATION_HANDLE_BASE_DISTANCE;
    const rotationHandleY = frame.y - rotDist;
    const rotationHandlePos = getRotatedPosition(frame.x + frame.width / 2, rotationHandleY);
    const distToRotation = Math.sqrt((x - rotationHandlePos.x) ** 2 + (y - rotationHandlePos.y) ** 2);
    if (distToRotation <= hitSize / 2 + 5) {
      return 'rotate';
    }

    return null;
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    
    const { x, y } = getMousePos(e);

    // Handle panning mode or middle mouse button
    if (interactionMode === 'pan' || e.button === 1) {
      setDragState({
        isDragging: false,
        isResizing: false,
        isRotating: false,
        isPanning: true,
        isCreating: false,
        startX: e.clientX,
        startY: e.clientY,
        startFrame: null,
        startPan: { ...panOffset },
        resizeHandle: null,
        createType: null,
        createShape: 'rectangle',
      });
      return;
    }

    const frame = getFrameAtPosition(x, y);
    
    if (frame) {
      const resizeHandle = getResizeHandle(x, y, frame);
      
      if (resizeHandle === 'rotate') {
        setDragState({
          isDragging: false,
          isResizing: false,
          isRotating: true,
          isPanning: false,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          startPan: null,
          resizeHandle: null,
          createType: null,
          createShape: 'rectangle',
        });
      } else if (resizeHandle) {
        setDragState({
          isDragging: false,
          isResizing: true,
          isRotating: false,
          isPanning: false,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          startPan: null,
          resizeHandle: resizeHandle as any,
          createType: null,
          createShape: 'rectangle',
        });
      } else {
        setDragState({
          isDragging: true,
          isResizing: false,
          isRotating: false,
          isPanning: false,
          isCreating: false,
          startX: x,
          startY: y,
          startFrame: { ...frame },
          startPan: null,
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
    if (!dragState.isDragging && !dragState.isResizing && !dragState.isRotating && !dragState.isCreating && !dragState.isPanning) {
      // Update cursor
      if (interactionMode === 'pan') {
        canvasRef.current!.style.cursor = dragState.isPanning ? 'grabbing' : 'grab';
        return;
      }

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

    // Handle panning logic
    if (dragState.isPanning) {
      // Delta needs to be divided by displayScale * zoom because that's how much the physical screen px is magnified
      const deltaX = (e.clientX - dragState.startX) / (displayScale * zoom);
      const deltaY = (e.clientY - dragState.startY) / (displayScale * zoom);
      
      setPanOffset({
        x: dragState.startPan!.x + deltaX,
        y: dragState.startPan!.y + deltaY
      });
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
        
        // Use modifier keys for different snapping behavior
        const useGrid = !e.altKey; // Alt key disables grid snapping for precise movement
        const useSnapping = !e.ctrlKey; // Ctrl key disables all snapping for free movement
        
        if (useSnapping) {
          const snapped = snapPosition(newX, newY, f.width, f.height, f.id, useGrid);
          newFrame.x = snapped.x;
          newFrame.y = snapped.y;
          setSnapLines(snapped.snapLines);
        } else {
          // Free movement - no snapping
          newFrame.x = newX;
          newFrame.y = newY;
          setSnapLines([]);
        }
        
        // Constrain to canvas boundaries
        newFrame.x = Math.max(0, Math.min(canvasSize.width - newFrame.width, newFrame.x));
        newFrame.y = Math.max(0, Math.min(canvasSize.height - newFrame.height, newFrame.y));
      } else if (dragState.isResizing) {
        const handle = dragState.resizeHandle;
        if (handle?.includes('e')) {
          const newWidth = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.width + deltaX);
          newFrame.width = Math.min(newWidth, canvasSize.width - newFrame.x);
        }
        if (handle?.includes('w')) {
          const newWidth = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.width - deltaX);
          const maxWidth = newFrame.x + newFrame.width;
          newFrame.x = Math.max(0, dragState.startFrame!.x + dragState.startFrame!.width - newWidth);
          newFrame.width = Math.min(newWidth, maxWidth - newFrame.x);
        }
        if (handle?.includes('s')) {
          const newHeight = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.height + deltaY);
          newFrame.height = Math.min(newHeight, canvasSize.height - newFrame.y);
        }
        if (handle?.includes('n')) {
          const newHeight = Math.max(MIN_FRAME_SIZE, dragState.startFrame!.height - deltaY);
          const maxHeight = newFrame.y + newFrame.height;
          newFrame.y = Math.max(0, dragState.startFrame!.y + dragState.startFrame!.height - newHeight);
          newFrame.height = Math.min(newHeight, maxHeight - newFrame.y);
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
  }, [dragState, getMousePos, frames, selectedFrameId, getFrameAtPosition, getResizeHandle, onFramesChange, canvasSize, displayScale, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || dragState.isResizing || dragState.isRotating || dragState.isCreating || dragState.isPanning) {
      if (!dragState.isPanning) {
        onFramesChangeEnd?.(frames);
      }
    }

    setDragState({
      isDragging: false,
      isResizing: false,
      isRotating: false,
      isPanning: false,
      isCreating: false,
      startX: 0,
      startY: 0,
      startFrame: null,
      startPan: null,
      resizeHandle: null,
      createType: null,
      createShape: 'rectangle',
    });
    setSnapLines([]);
  }, [dragState, frames, onFramesChangeEnd]);

  const updateFrame = useCallback((updates: Partial<FrameData>) => {
    if (!selectedFrame || readOnly || !onFramesChange) return;
    
    const updatedFrames = frames.map(f => 
      f.id === selectedFrame.id ? { ...f, ...updates } : f
    );
    onFramesChange(updatedFrames);
  }, [selectedFrame, readOnly, onFramesChange, frames]);

  const moveFrame = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (!selectedFrame || !onFramesChange) return;
    
    const index = frames.findIndex(f => f.id === selectedFrame.id);
    if (index === -1) return;
    
    let newFrames = [...frames];
    const item = newFrames.splice(index, 1)[0];
    
    if (direction === 'front') {
      newFrames.push(item);
    } else if (direction === 'back') {
      newFrames.unshift(item);
    } else if (direction === 'forward') {
      newFrames.splice(Math.min(frames.length - 1, index + 1), 0, item);
    } else if (direction === 'backward') {
      newFrames.splice(Math.max(0, index - 1), 0, item);
    }
    
    onFramesChange(newFrames);
  }, [selectedFrame, onFramesChange, frames]);

  // Quick frame creation
  const createFrame = useCallback((type: 'image' | 'text', shape: 'rectangle' | 'circle' | 'rounded-rectangle' = 'rectangle') => {
    if (!onFramesChange) return;

    const frameWidth = type === 'image' ? 200 : 300;
    const frameHeight = type === 'image' ? 200 : 80;
    
    // Calculate center position (1200x800 is the internal canvas size)
    const centerX = 1200 / 2 - frameWidth / 2;
    const centerY = 800 / 2 - frameHeight / 2;
    
    // Add a slight stagger for multiple elements
    const staggerOffset = (frames.length % 10) * 20;
    const x = centerX + staggerOffset;
    const y = centerY + staggerOffset;

    const newFrame: FrameData = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x,
      y,
      width: frameWidth,
      height: frameHeight,
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
          const newX = Math.max(0, selectedFrame.x - step);
          const snappedX = snapToGrid(newX);
          updateFrame({ x: snappedX });
          break;
        case 'ArrowRight':
          e.preventDefault();
          const newXRight = Math.min(canvasSize.width - selectedFrame.width, selectedFrame.x + step);
          const snappedXRight = snapToGrid(newXRight);
          updateFrame({ x: snappedXRight });
          break;
        case 'ArrowUp':
          e.preventDefault();
          const newY = Math.max(0, selectedFrame.y - step);
          const snappedY = snapToGrid(newY);
          updateFrame({ y: snappedY });
          break;
        case 'ArrowDown':
          e.preventDefault();
          const newYDown = Math.min(canvasSize.height - selectedFrame.height, selectedFrame.y + step);
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
  }, [selectedFrame, onFrameSelect, readOnly, updateFrame, deleteSelectedFrame]);

  // Spacebar panning effect
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          interactionMode !== 'pan') {
        setInteractionMode('pan');
        e.preventDefault();
      }
      
      // Shortcut keys
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key.toLowerCase() === 'v') setInteractionMode('select');
        if (e.key.toLowerCase() === 'h') setInteractionMode('pan');
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && interactionMode === 'pan') {
        // Only switch back if we are using temporary spacebar panning
        // We'll need another state to track if space is pressed
        setInteractionMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [interactionMode, readOnly]);


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

  // Native Gesture Control (Pinch-to-zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Handle trackpad pinch (Ctrl + Wheel)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSpeed = 0.01;
        const delta = -e.deltaY * zoomSpeed;
        setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
      }
    };

    // Handle touch pinch
    let initialDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Stop page scaling
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        
        const delta = (dist - initialDist) * 0.01;
        setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
        initialDist = dist;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [setZoom]);

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
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Canvas Workspace */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative p-4 sm:p-8 flex items-center justify-center min-h-[400px] min-w-[300px]"
      >
        <div 
          className="relative shadow-2xl bg-white border border-slate-200 flex-shrink-0 transition-transform duration-150 ease-out"
          style={{ 
            width: canvasSize.width * displayScale * zoom, 
            height: canvasSize.height * displayScale * zoom,
            minWidth: canvasSize.width * displayScale * zoom,
            minHeight: canvasSize.height * displayScale * zoom
          }}
        >
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 block ${readOnly ? 'cursor-default' : (interactionMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair')} touch-none`}
            style={{ 
              width: '100%', 
              height: '100%'
            }}
            onMouseDown={readOnly ? undefined : handleMouseDown}
            onMouseMove={readOnly ? undefined : handleMouseMove}
            onMouseUp={readOnly ? undefined : handleMouseUp}
            onMouseLeave={readOnly ? undefined : handleMouseUp}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
                <p className="text-sm font-medium text-amber-900">Syncing Canvas...</p>
              </div>
            </div>
          )}
          
          {/* Contextual Mini-Toolbar (appears above selected frame) */}
          {selectedFrame && !readOnly && !dragState.isDragging && !dragState.isResizing && !dragState.isRotating && (
            <div 
              className="absolute z-[100] flex items-center gap-1 bg-slate-900 shadow-2xl rounded-lg p-1.5 animate-in fade-in zoom-in duration-200 whitespace-nowrap ring-1 ring-white/10"
              style={{
                left: `${(selectedFrame.x + panOffset.x + selectedFrame.width / 2) * (zoom * displayScale)}px`,
                top: `${(selectedFrame.y + panOffset.y) * (zoom * displayScale) - 55}px`,
                transform: 'translateX(-50%)',
                width: 'auto',
                minWidth: 'max-content'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 flex-nowrap">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white hover:bg-slate-800"
                  onClick={() => {
                    const id = `frame_${Date.now()}`;
                    if (onFramesChange) {
                      onFramesChange([...frames, { ...selectedFrame, id, x: selectedFrame.x + 20, y: selectedFrame.y + 20 }]);
                      onFrameSelect(id);
                    }
                  }}
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white hover:bg-slate-800"
                  onClick={() => updateFrame({ locked: !selectedFrame.locked })}
                  title={selectedFrame.locked ? "Unlock" : "Lock"}
                >
                  {selectedFrame.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </Button>
                
                <Separator orientation="vertical" className="h-4 bg-slate-700 mx-0.5" />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white hover:bg-slate-800"
                  onClick={() => moveFrame('forward')}
                  title="Bring Forward"
                >
                  <MoveUp className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white hover:bg-slate-800"
                  onClick={() => moveFrame('backward')}
                  title="Send Backward"
                >
                  <MoveDown className="h-3.5 w-3.5" />
                </Button>
 
                <Separator orientation="vertical" className="h-4 bg-slate-700 mx-0.5" />
 
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white hover:bg-red-600"
                  onClick={() => deleteSelectedFrame()}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 