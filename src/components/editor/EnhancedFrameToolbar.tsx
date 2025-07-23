/**
 * Enhanced Frame Toolbar Component
 * Advanced toolbar for creating and managing frames with different shapes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Plus,
  RotateCw,
  Move,
  Trash2,
  Copy,
  Layers,
  Hexagon,
  Star,
  Heart
} from 'lucide-react';

// Custom RoundedSquare icon component
const RoundedSquare = ({ className, ...props }: any) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);
import { FrameData } from './EnhancedCanvasEditor';
import { toast } from 'sonner';

interface EnhancedFrameToolbarProps {
  onAddFrame: (frame: FrameData) => void;
  onDeleteFrame: (frameId: string) => void;
  onDuplicateFrame: (frame: FrameData) => void;
  selectedFrame: FrameData | null;
  frames: FrameData[];
}

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle', icon: Square, description: 'Standard rectangular frame' },
  { value: 'rounded-rectangle', label: 'Rounded Rectangle', icon: RoundedSquare, description: 'Rectangle with rounded corners' },
  { value: 'circle', label: 'Circle', icon: Circle, description: 'Perfect circular frame' },
  { value: 'polygon', label: 'Polygon', icon: Hexagon, description: 'Custom polygon shape' },
];

const POLYGON_PRESETS = [
  { name: 'Triangle', points: [[0, 1], [1, 0], [1, 1]] },
  { name: 'Diamond', points: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]] },
  { name: 'Hexagon', points: [[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]] },
  { name: 'Star', points: [[0.5, 0], [0.6, 0.4], [1, 0.4], [0.7, 0.6], [0.8, 1], [0.5, 0.8], [0.2, 1], [0.3, 0.6], [0, 0.4], [0.4, 0.4]] },
];

export default function EnhancedFrameToolbar({
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  selectedFrame,
  frames,
}: EnhancedFrameToolbarProps) {
  const [selectedShape, setSelectedShape] = useState<FrameData['shape']>('rectangle');
  const [selectedType, setSelectedType] = useState<'image' | 'text'>('text');

  const generateId = () => `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createFrame = (shape: FrameData['shape'], type: 'image' | 'text') => {
    const baseFrame: FrameData = {
      id: generateId(),
      type,
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      rotation: 0,
      shape,
      properties: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'center',
        placeholder: type === 'text' ? 'Enter text here' : 'Image placeholder',
      },
    };

    // Add shape-specific properties
    if (shape === 'rounded-rectangle') {
      baseFrame.cornerRadius = 10;
    } else if (shape === 'polygon') {
      baseFrame.points = POLYGON_PRESETS[0].points; // Default to triangle
    }

    onAddFrame(baseFrame);
    toast.success(`${shape.charAt(0).toUpperCase() + shape.slice(1)} ${type} frame added`);
  };

  const handleAddFrame = () => {
    createFrame(selectedShape, selectedType);
  };

  const handleDeleteFrame = () => {
    if (selectedFrame) {
      onDeleteFrame(selectedFrame.id);
      toast.success('Frame deleted');
    }
  };

  const handleDuplicateFrame = () => {
    if (selectedFrame) {
      const duplicatedFrame = {
        ...selectedFrame,
        id: generateId(),
        x: selectedFrame.x + 20,
        y: selectedFrame.y + 20,
      };
      onDuplicateFrame(duplicatedFrame);
      toast.success('Frame duplicated');
    }
  };

  const getShapeIcon = (shape: FrameData['shape']) => {
    switch (shape) {
      case 'circle': return Circle;
      case 'rounded-rectangle': return RoundedSquare;
      case 'polygon': return Hexagon;
      default: return Square;
    }
  };

  const getTypeIcon = (type: 'image' | 'text') => {
    return type === 'text' ? Type : ImageIcon;
  };

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Frame Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Frame Creation */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Create New Frame</h3>
          
          {/* Shape Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Shape</label>
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_OPTIONS.map((shape) => {
                const Icon = shape.icon;
                return (
                  <Button
                    key={shape.value}
                    variant={selectedShape === shape.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-12 flex-col gap-1"
                    onClick={() => setSelectedShape(shape.value as FrameData['shape'])}
                    title={shape.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{shape.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Type</label>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'text' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedType('text')}
              >
                <Type className="mr-2 h-4 w-4" />
                Text
              </Button>
              <Button
                variant={selectedType === 'image' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedType('image')}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Image
              </Button>
            </div>
          </div>

          {/* Add Frame Button */}
          <Button
            onClick={handleAddFrame}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Frame
          </Button>
        </div>

        <Separator />

        {/* Frame Management */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Frame Management</h3>
          
          {selectedFrame ? (
            <div className="space-y-3">
              {/* Selected Frame Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const ShapeIcon = getShapeIcon(selectedFrame.shape);
                    const TypeIcon = getTypeIcon(selectedFrame.type);
                    return (
                      <>
                        <ShapeIcon className="h-4 w-4 text-gray-600" />
                        <TypeIcon className="h-4 w-4 text-gray-600" />
                      </>
                    );
                  })()}
                  <span className="text-sm font-medium">Selected Frame</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Position: {Math.round(selectedFrame.x)}, {Math.round(selectedFrame.y)}</div>
                  <div>Size: {Math.round(selectedFrame.width)} × {Math.round(selectedFrame.height)}</div>
                  <div>Rotation: {Math.round(selectedFrame.rotation)}°</div>
                  <div>Shape: {selectedFrame.shape}</div>
                </div>
              </div>

              {/* Frame Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateFrame}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteFrame}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Move className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Select a frame to manage</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Frame List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">All Frames ({frames.length})</h3>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {frames.map((frame) => {
              const ShapeIcon = getShapeIcon(frame.shape);
              const TypeIcon = getTypeIcon(frame.type);
              
              return (
                <div
                  key={frame.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    selectedFrame?.id === frame.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    // This would need to be passed down from parent
                    // For now, just show a toast
                    toast.info(`Frame ${frame.id} selected`);
                  }}
                >
                  <ShapeIcon className="h-3 w-3 text-gray-500" />
                  <TypeIcon className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-700 flex-1 truncate">
                    {frame.properties?.placeholder || `${frame.shape} ${frame.type}`}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {frame.id.slice(-4)}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {frames.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No frames created yet</p>
            </div>
          )}
        </div>

        {/* Polygon Presets (when polygon is selected) */}
        {selectedShape === 'polygon' && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Polygon Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {POLYGON_PRESETS.map((preset, index) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => {
                      setSelectedShape('polygon');
                      toast.info(`${preset.name} preset selected`);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 