/**
 * Properties Panel Component
 * Panel for customizing selected frame properties (text styling, alignment, etc.)
 */

import { useState, useEffect } from 'react';
import { Palette, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { getAvailableFonts } from '@/lib/fontUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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

interface PropertiesPanelProps {
  frame: FrameData;
  onFrameUpdate: (frame: FrameData) => void;
}

export default function PropertiesPanel({ frame, onFrameUpdate }: PropertiesPanelProps) {
  const [customColor, setCustomColor] = useState(frame.properties?.color || '#000000');
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  useEffect(() => {
    // Load available fonts (system + custom)
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Tahoma',
      'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console'
    ];
    const customFonts = getAvailableFonts();
    const allFonts = [...systemFonts, ...customFonts];
    const uniqueFonts = [...new Set(allFonts)]; // Remove duplicates
    setAvailableFonts(uniqueFonts);
  }, []);

  const fontFamilies = availableFonts.map(font => ({
    value: font,
    label: font
  }));

const textAlignOptions = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

const presetColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000',
];

  const updateFrameProperty = (property: string, value: any) => {
    const updatedFrame = {
      ...frame,
      properties: {
        ...frame.properties,
        [property]: value,
      },
    };
    onFrameUpdate(updatedFrame);
  };

  const updateFrameDimensions = (dimension: 'width' | 'height', value: number) => {
    const updatedFrame = {
      ...frame,
      [dimension]: Math.max(10, value), // Minimum size of 10px
    };
    onFrameUpdate(updatedFrame);
  };

  const updateFramePosition = (axis: 'x' | 'y', value: number) => {
    const updatedFrame = {
      ...frame,
      [axis]: Math.max(0, value), // Minimum position of 0
    };
    onFrameUpdate(updatedFrame);
  };

  if (frame.type === 'image') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Palette className="mr-2 h-4 w-4 text-blue-600" />
              Image Frame Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="image-x">X Position</Label>
                <Input
                  id="image-x"
                  type="number"
                  value={frame.x}
                  onChange={(e) => updateFramePosition('x', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-y">Y Position</Label>
                <Input
                  id="image-y"
                  type="number"
                  value={frame.y}
                  onChange={(e) => updateFramePosition('y', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="image-width">Width</Label>
                <Input
                  id="image-width"
                  type="number"
                  value={frame.width}
                  onChange={(e) => updateFrameDimensions('width', parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-height">Height</Label>
                <Input
                  id="image-height"
                  type="number"
                  value={frame.height}
                  onChange={(e) => updateFrameDimensions('height', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Image Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-1">
            <p>• Users will upload images to this frame</p>
            <p>• Images will be automatically cropped to fit</p>
            <p>• Recommended aspect ratio: {Math.round(frame.width / frame.height * 100) / 100}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (frame.type === 'text') {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
              <Type className="mr-2 h-4 w-4 text-green-600" />
            Text Frame Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="text-x">X Position</Label>
              <Input
                id="text-x"
                type="number"
                value={frame.x}
                onChange={(e) => updateFramePosition('x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-y">Y Position</Label>
              <Input
                id="text-y"
                type="number"
                value={frame.y}
                onChange={(e) => updateFramePosition('y', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="text-width">Width</Label>
              <Input
                id="text-width"
                type="number"
                value={frame.width}
                onChange={(e) => updateFrameDimensions('width', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-height">Height</Label>
              <Input
                id="text-height"
                type="number"
                value={frame.height}
                onChange={(e) => updateFrameDimensions('height', parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

            {/* Placeholder Text */}
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Textarea
                id="placeholder"
                placeholder="Enter placeholder text..."
                value={frame.properties?.placeholder || ''}
                onChange={(e) => updateFrameProperty('placeholder', e.target.value)}
                rows={2}
              />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium">Text Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Font Family */}
          <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={frame.properties?.fontFamily || 'Arial'}
              onValueChange={(value) => updateFrameProperty('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {frame.properties?.fontSize || 24}px</Label>
            <Slider
                id="font-size"
              min={8}
              max={72}
              step={1}
                value={[frame.properties?.fontSize || 24]}
                onValueChange={([value]) => updateFrameProperty('fontSize', value)}
              className="w-full"
            />
          </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={frame.properties?.color || '#000000'}
                  onChange={(e) => updateFrameProperty('color', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={frame.properties?.color || '#000000'}
                  onChange={(e) => updateFrameProperty('color', e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-8 h-8 rounded border-2 transition-colors',
                      frame.properties?.color === color
                        ? 'border-gray-900'
                        : 'border-gray-300 hover:border-gray-500'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => updateFrameProperty('color', color)}
                  />
                ))}
              </div>
            </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <div className="flex gap-1">
              {textAlignOptions.map((option) => {
                  const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                      variant={frame.properties?.textAlign === option.value ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => updateFrameProperty('textAlign', option.value)}
                    className="flex-1"
                  >
                      <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium">Text Guidelines</CardTitle>
        </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-1">
            <p>• Users will enter text in this frame</p>
            <p>• Text will wrap automatically within the frame</p>
            <p>• Recommended max characters: {Math.floor(frame.width / 8)}</p>
        </CardContent>
      </Card>
    </div>
  );
  }

  return null;
} 