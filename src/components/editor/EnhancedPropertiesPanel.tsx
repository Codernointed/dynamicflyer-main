/**
 * Enhanced Properties Panel Component
 * Simple and intuitive panel for editing frame properties
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Trash2,
  Copy,
  RotateCw,
  ChevronUp,
  ChevronDown
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

// Custom Hexagon icon component
const Hexagon = ({ className, ...props }: any) => (
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
    <path d="M12 2L21 8.5V15.5L12 22L3 15.5V8.5L12 2Z" />
  </svg>
);
import { FrameData } from './EnhancedCanvasEditor';

interface EnhancedPropertiesPanelProps {
  frame: FrameData;
  onFrameUpdate?: (frameId: string, updates: Partial<FrameData>) => void;
  onFrameDelete?: (frameId: string) => void;
  onFrameDuplicate?: (frameId: string) => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Courier New'
];

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle', icon: Square },
  { value: 'rounded-rectangle', label: 'Rounded', icon: RoundedSquare },
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'polygon', label: 'Polygon', icon: Hexagon }
];

export default function EnhancedPropertiesPanel({
  frame,
  onFrameUpdate,
  onFrameDelete,
  onFrameDuplicate,
}: EnhancedPropertiesPanelProps) {
  const [localFrame, setLocalFrame] = useState<FrameData>(frame);

  const updateFrame = (updates: Partial<FrameData>) => {
    const updatedFrame = { ...localFrame, ...updates };
    setLocalFrame(updatedFrame);
    onFrameUpdate?.(frame.id, updates);
  };

  const getShapeIcon = (shape: FrameData['shape']) => {
    const option = SHAPE_OPTIONS.find(opt => opt.value === shape);
    return option ? option.icon : Square;
  };



  return (
    <div className="space-y-4">
      {/* Frame Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {frame.type === 'text' ? <Type className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            {frame.type === 'image' ? 'Image' : 'Text'} Frame
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <Label className="text-gray-500">Position</Label>
              <div className="font-mono">X: {Math.round(frame.x)}</div>
              <div className="font-mono">Y: {Math.round(frame.y)}</div>
            </div>
            <div>
              <Label className="text-gray-500">Size</Label>
              <div className="font-mono">W: {Math.round(frame.width)}</div>
              <div className="font-mono">H: {Math.round(frame.height)}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFrameDuplicate?.(frame.id)}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFrameDelete?.(frame.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shape Properties */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Shape</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Shape Type</Label>
            <Select
              value={localFrame.shape}
              onValueChange={(value) => updateFrame({ shape: value as FrameData['shape'] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHAPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {localFrame.shape === 'rounded-rectangle' && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">
                Corner Radius: {localFrame.cornerRadius || 10}px
              </Label>
              <Slider
                value={[localFrame.cornerRadius || 10]}
                onValueChange={([value]) => updateFrame({ cornerRadius: value })}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500">
                Rotation: {Math.round(localFrame.rotation)}°
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFrame({ rotation: localFrame.rotation - 1 })}
                  className="h-6 w-6 p-0"
                  disabled={localFrame.rotation <= -360}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFrame({ rotation: localFrame.rotation + 1 })}
                  className="h-6 w-6 p-0"
                  disabled={localFrame.rotation >= 360}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Slider
              value={[localFrame.rotation]}
              onValueChange={([value]) => updateFrame({ rotation: value })}
              max={360}
              min={-360}
              step={1}
              className="w-full"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFrame({ rotation: 0 })}
              className="w-full"
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Reset Rotation
            </Button>
          </div>

          {/* Polygon Sides (only for polygon shapes) */}
          {localFrame.shape === 'polygon' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">
                  Sides: {localFrame.polygonSides || 6}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFrame({ polygonSides: Math.max(3, (localFrame.polygonSides || 6) - 1) })}
                    className="h-6 w-6 p-0"
                    disabled={(localFrame.polygonSides || 6) <= 3}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFrame({ polygonSides: Math.min(12, (localFrame.polygonSides || 6) + 1) })}
                    className="h-6 w-6 p-0"
                    disabled={(localFrame.polygonSides || 6) >= 12}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[localFrame.polygonSides || 6]}
                onValueChange={([value]) => updateFrame({ polygonSides: value })}
                max={12}
                min={3}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-400">
                3=Triangle, 6=Hexagon, 8=Octagon, etc.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Properties (only for text frames) */}
      {frame.type === 'text' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Text Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Placeholder Text</Label>
              <Input
                value={localFrame.properties?.placeholder || ''}
                onChange={(e) => updateFrame({
                  properties: { ...localFrame.properties, placeholder: e.target.value }
                })}
                placeholder="Enter placeholder text..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Font Family</Label>
              <Select
                value={localFrame.properties?.fontFamily || 'Arial'}
                onValueChange={(value) => updateFrame({
                  properties: { ...localFrame.properties, fontFamily: value }
                })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">
                  Font Size: {localFrame.properties?.fontSize || 24}px
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFrame({
                      properties: { ...localFrame.properties, fontSize: Math.max(8, (localFrame.properties?.fontSize || 24) - 1) }
                    })}
                    className="h-6 w-6 p-0"
                    disabled={(localFrame.properties?.fontSize || 24) <= 8}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFrame({
                      properties: { ...localFrame.properties, fontSize: Math.min(72, (localFrame.properties?.fontSize || 24) + 1) }
                    })}
                    className="h-6 w-6 p-0"
                    disabled={(localFrame.properties?.fontSize || 24) >= 72}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[localFrame.properties?.fontSize || 24]}
                onValueChange={([value]) => updateFrame({
                  properties: { ...localFrame.properties, fontSize: value }
                })}
                max={72}
                min={8}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Text Color</Label>
              <Input
                type="color"
                value={localFrame.properties?.color || '#000000'}
                onChange={(e) => updateFrame({
                  properties: { ...localFrame.properties, color: e.target.value }
                })}
                className="h-8 w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Text Alignment</Label>
              <Select
                value={localFrame.properties?.textAlign || 'center'}
                onValueChange={(value) => updateFrame({
                  properties: { ...localFrame.properties, textAlign: value }
                })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_ALIGN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFrame({ x: 0, y: 0 })}
            className="w-full"
          >
            Move to Top-Left
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFrame({ rotation: 0 })}
            className="w-full"
          >
            Reset Rotation
          </Button>
          {frame.type === 'text' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFrame({
                properties: {
                  ...localFrame.properties,
                  fontSize: 24,
                  fontFamily: 'Arial',
                  color: '#000000',
                  textAlign: 'center'
                }
              })}
              className="w-full"
            >
              Reset Text Style
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 