/**
 * Enhanced Properties Panel Component
 * Advanced properties panel for frame editing with precise controls
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Slider,
} from '@/components/ui/slider';
import {
  RotateCw,
  Move,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Lock,
  Unlock,
  Copy,
  Trash2,
  RotateCcw,
  RotateCw as RotateCwIcon,
  Minus,
  Plus,
  Palette,
  FontSize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { FrameData } from './EnhancedCanvasEditor';
import { getAvailableFonts } from '@/lib/fontUtils';
import { toast } from 'sonner';

interface EnhancedPropertiesPanelProps {
  frame: FrameData | null;
  onFrameUpdate: (frameId: string, updates: Partial<FrameData>) => void;
  onFrameDelete: (frameId: string) => void;
  onFrameDuplicate: (frame: FrameData) => void;
}

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Tahoma',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console'
];

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle', icon: Square },
  { value: 'rounded-rectangle', label: 'Rounded Rectangle', icon: Square },
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'polygon', label: 'Polygon', icon: Square },
];

export default function EnhancedPropertiesPanel({
  frame,
  onFrameUpdate,
  onFrameDelete,
  onFrameDuplicate,
}: EnhancedPropertiesPanelProps) {
  const [availableFonts, setAvailableFonts] = useState<string[]>(FONT_FAMILIES);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Load available fonts
    const fonts = getAvailableFonts();
    setAvailableFonts([...FONT_FAMILIES, ...fonts]);
  }, []);

  if (!frame) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Square className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Select a frame to edit properties</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updateFrame = (updates: Partial<FrameData>) => {
    if (!isLocked) {
      onFrameUpdate(frame.id, updates);
    }
  };

  const updateProperty = (property: string, value: any) => {
    updateFrame({
      properties: {
        ...frame.properties,
        [property]: value,
      },
    });
  };

  const handleRotate = (degrees: number) => {
    updateFrame({ rotation: frame.rotation + degrees });
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      updateFrame({ width: -frame.width });
    } else {
      updateFrame({ height: -frame.height });
    }
  };

  const handleResetTransform = () => {
    updateFrame({
      x: 100,
      y: 100,
      width: Math.abs(frame.width),
      height: Math.abs(frame.height),
      rotation: 0,
    });
  };

  const handleDelete = () => {
    onFrameDelete(frame.id);
    toast.success('Frame deleted');
  };

  const handleDuplicate = () => {
    onFrameDuplicate(frame);
    toast.success('Frame duplicated');
  };

  const getShapeIcon = (shape: FrameData['shape']) => {
    switch (shape) {
      case 'circle': return Circle;
      case 'rounded-rectangle': return Square;
      case 'polygon': return Square;
      default: return Square;
    }
  };

  const getTypeIcon = (type: 'image' | 'text') => {
    return type === 'text' ? Type : ImageIcon;
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Properties</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? 'Unlock frame' : 'Lock frame'}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              title="Duplicate frame"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              title="Delete frame"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Frame Info */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          {(() => {
            const ShapeIcon = getShapeIcon(frame.shape);
            const TypeIcon = getTypeIcon(frame.type);
            return (
              <>
                <ShapeIcon className="h-4 w-4 text-gray-600" />
                <TypeIcon className="h-4 w-4 text-gray-600" />
              </>
            );
          })()}
          <span className="text-sm font-medium">{frame.shape} {frame.type}</span>
          <Badge variant="secondary" className="text-xs">
            {frame.id.slice(-4)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transform Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Move className="h-4 w-4" />
            Transform
          </h3>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X Position</Label>
              <Input
                type="number"
                value={Math.round(frame.x)}
                onChange={(e) => updateFrame({ x: parseFloat(e.target.value) || 0 })}
                disabled={isLocked}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y Position</Label>
              <Input
                type="number"
                value={Math.round(frame.y)}
                onChange={(e) => updateFrame({ y: parseFloat(e.target.value) || 0 })}
                disabled={isLocked}
                className="text-xs"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={Math.round(Math.abs(frame.width))}
                onChange={(e) => updateFrame({ width: parseFloat(e.target.value) || 1 })}
                disabled={isLocked}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={Math.round(Math.abs(frame.height))}
                onChange={(e) => updateFrame({ height: parseFloat(e.target.value) || 1 })}
                disabled={isLocked}
                className="text-xs"
              />
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Rotation</Label>
              <span className="text-xs text-gray-500">{Math.round(frame.rotation)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(-90)}
                disabled={isLocked}
                className="flex-1"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Slider
                value={[frame.rotation]}
                onValueChange={([value]) => updateFrame({ rotation: value })}
                min={-180}
                max={180}
                step={1}
                disabled={isLocked}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(90)}
                disabled={isLocked}
                className="flex-1"
              >
                <RotateCwIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTransform}
              disabled={isLocked}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlip('horizontal')}
              disabled={isLocked}
            >
              Flip H
            </Button>
          </div>
        </div>

        <Separator />

        {/* Shape Properties */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Square className="h-4 w-4" />
            Shape
          </h3>

          {/* Shape Type */}
          <div className="space-y-2">
            <Label className="text-xs">Shape Type</Label>
            <Select
              value={frame.shape}
              onValueChange={(value) => updateFrame({ shape: value as FrameData['shape'] })}
              disabled={isLocked}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHAPE_OPTIONS.map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <SelectItem key={shape.value} value={shape.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        <span>{shape.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Corner Radius for Rounded Rectangle */}
          {frame.shape === 'rounded-rectangle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Corner Radius</Label>
                <span className="text-xs text-gray-500">{frame.cornerRadius || 0}px</span>
              </div>
              <Slider
                value={[frame.cornerRadius || 0]}
                onValueChange={([value]) => updateFrame({ cornerRadius: value })}
                min={0}
                max={50}
                step={1}
                disabled={isLocked}
              />
            </div>
          )}
        </div>

        {/* Text Properties (only for text frames) */}
        {frame.type === 'text' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Properties
              </h3>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={frame.properties?.fontFamily || 'Arial'}
                  onValueChange={(value) => updateProperty('fontFamily', value)}
                  disabled={isLocked}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFonts.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Font Size</Label>
                  <span className="text-xs text-gray-500">{frame.properties?.fontSize || 16}px</span>
                </div>
                <Slider
                  value={[frame.properties?.fontSize || 16]}
                  onValueChange={([value]) => updateProperty('fontSize', value)}
                  min={8}
                  max={72}
                  step={1}
                  disabled={isLocked}
                />
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label className="text-xs">Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={frame.properties?.color || '#000000'}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    disabled={isLocked}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={frame.properties?.color || '#000000'}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    disabled={isLocked}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs">Text Alignment</Label>
                <div className="flex gap-1">
                  {TEXT_ALIGN_OPTIONS.map((align) => {
                    const Icon = align.icon;
                    return (
                      <Button
                        key={align.value}
                        variant={frame.properties?.textAlign === align.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateProperty('textAlign', align.value)}
                        disabled={isLocked}
                        className="flex-1"
                      >
                        <Icon className="h-3 w-3" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Placeholder Text */}
              <div className="space-y-2">
                <Label className="text-xs">Placeholder Text</Label>
                <Input
                  value={frame.properties?.placeholder || ''}
                  onChange={(e) => updateProperty('placeholder', e.target.value)}
                  disabled={isLocked}
                  className="text-xs"
                  placeholder="Enter placeholder text..."
                />
              </div>
            </div>
          </>
        )}

        {/* Image Properties (only for image frames) */}
        {frame.type === 'image' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Properties
              </h3>

              <div className="text-center py-4 text-gray-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Image upload coming soon</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 