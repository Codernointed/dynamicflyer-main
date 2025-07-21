/**
 * Frame Toolbar Component
 * Tools for creating and managing image and text frames
 */

import { useState } from 'react';
import { Plus, Image as ImageIcon, Type, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

interface FrameToolbarProps {
  frames: FrameData[];
  selectedFrameId: string | null;
  onFramesChange: (frames: FrameData[]) => void;
  onFrameSelect: (frameId: string | null) => void;
  canvasReady: boolean;
}

export default function FrameToolbar({
  frames,
  selectedFrameId,
  onFramesChange,
  onFrameSelect,
  canvasReady,
}: FrameToolbarProps) {
  const [draggedFrame, setDraggedFrame] = useState<string | null>(null);

  const generateFrameId = () => {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createImageFrame = () => {
    if (!canvasReady) return;

    const newFrame: FrameData = {
      id: generateFrameId(),
      type: 'image',
      x: 100 + frames.length * 20,
      y: 100 + frames.length * 20,
      width: 200,
      height: 200,
    };

    onFramesChange([...frames, newFrame]);
    onFrameSelect(newFrame.id);
  };

  const createTextFrame = () => {
    if (!canvasReady) return;

    const newFrame: FrameData = {
      id: generateFrameId(),
      type: 'text',
      x: 150 + frames.length * 20,
      y: 150 + frames.length * 20,
      width: 300,
      height: 50,
      properties: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'center',
        placeholder: 'Enter your text here',
      },
    };

    onFramesChange([...frames, newFrame]);
    onFrameSelect(newFrame.id);
  };

  const deleteFrame = (frameId: string) => {
    const updatedFrames = frames.filter(frame => frame.id !== frameId);
    onFramesChange(updatedFrames);
    
    if (selectedFrameId === frameId) {
      onFrameSelect(null);
    }
  };

  const duplicateFrame = (frameId: string) => {
    const frameToClone = frames.find(f => f.id === frameId);
    if (!frameToClone) return;

    const newFrame: FrameData = {
      ...frameToClone,
      id: generateFrameId(),
      x: frameToClone.x + 20,
      y: frameToClone.y + 20,
    };

    onFramesChange([...frames, newFrame]);
    onFrameSelect(newFrame.id);
  };

  const handleFrameReorder = (dragIndex: number, dropIndex: number) => {
    const reorderedFrames = [...frames];
    const [draggedFrame] = reorderedFrames.splice(dragIndex, 1);
    reorderedFrames.splice(dropIndex, 0, draggedFrame);
    onFramesChange(reorderedFrames);
  };

  const getFrameIcon = (type: string) => {
    return type === 'image' ? ImageIcon : Type;
  };

  const getFrameColor = (type: string) => {
    return type === 'image' ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-4">
      {/* Add Frame Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Add Frames</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={createImageFrame}
            disabled={!canvasReady}
          >
            <ImageIcon className="mr-2 h-4 w-4 text-blue-600" />
            Add Image Frame
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={createTextFrame}
            disabled={!canvasReady}
          >
            <Type className="mr-2 h-4 w-4 text-red-600" />
            Add Text Frame
          </Button>
        </CardContent>
      </Card>

      {/* Frame List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Frames
            <Badge variant="secondary" className="text-xs">
              {frames.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No frames yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add image or text frames to define user input areas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {frames.map((frame, index) => {
                const IconComponent = getFrameIcon(frame.type);
                const isSelected = selectedFrameId === frame.id;
                
                return (
                  <div
                    key={frame.id}
                    className={cn(
                      "group p-3 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => onFrameSelect(frame.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center",
                          getFrameColor(frame.type)
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">
                            {frame.type === 'image' ? 'Image Frame' : 'Text Frame'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {frame.width} × {frame.height} px
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateFrame(frame.id);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFrame(frame.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Frame Properties Preview */}
                    {frame.type === 'text' && frame.properties && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>Font: {frame.properties.fontFamily}</span>
                          <span>Size: {frame.properties.fontSize}px</span>
                          <span style={{ color: frame.properties.color }}>●</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frame Guidelines */}
      {frames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Frame Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-1">
            <p>• Blue frames = Image upload areas</p>
            <p>• Red frames = Text input areas</p>
            <p>• Users will see only the frames, not the background</p>
            <p>• Make frames large enough for content</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 