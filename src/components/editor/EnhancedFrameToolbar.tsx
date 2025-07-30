/**
 * Enhanced Frame Toolbar Component
 * Simple and intuitive toolbar for creating and managing frames
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle, 
  Trash2,
  Copy,
  Layers
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

interface EnhancedFrameToolbarProps {
  frames: FrameData[];
  selectedFrameId: string | null;
  onFramesChange: (frames: FrameData[]) => void;
  onFrameSelect: (frameId: string | null) => void;
  canvasReady: boolean;
}

export default function EnhancedFrameToolbar({
  frames,
  selectedFrameId,
  onFramesChange,
  onFrameSelect,
  canvasReady,
}: EnhancedFrameToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generateFrameId = () => {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createFrame = (type: 'image' | 'text', shape: 'rectangle' | 'circle' | 'rounded-rectangle' | 'polygon' = 'rectangle', polygonSides?: number) => {
    if (!canvasReady) return;

    const newFrame: FrameData = {
      id: generateFrameId(),
      type,
      x: 100 + frames.length * 20,
      y: 100 + frames.length * 20,
      width: type === 'image' ? 200 : 300,
      height: type === 'image' ? 200 : 80,
      rotation: 0,
      shape,
      cornerRadius: shape === 'rounded-rectangle' ? 10 : undefined,
      polygonSides: shape === 'polygon' ? (polygonSides || 6) : undefined,
      properties: type === 'text' ? {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'center',
        placeholder: 'Enter your text here',
      } : undefined,
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

  const selectedFrame = frames.find(f => f.id === selectedFrameId);

  return (
    <div className="space-y-4">
      {/* Quick Add Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => createFrame('image', 'rectangle')}
              disabled={!canvasReady}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Image Frame</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createFrame('text', 'rectangle')}
              disabled={!canvasReady}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <Type className="h-5 w-5 text-green-600" />
              <span className="text-xs">Text Frame</span>
            </Button>
          </div>
          
          {showAdvanced && (
            <div className="space-y-2">
              <Separator />
              <div className="text-xs text-gray-500 font-medium">Shapes</div>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createFrame('image', 'circle')}
                  disabled={!canvasReady}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <Circle className="h-4 w-4" />
                  <span className="text-xs">Circle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createFrame('image', 'rounded-rectangle')}
                  disabled={!canvasReady}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <RoundedSquare className="h-4 w-4" />
                  <span className="text-xs">Rounded</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createFrame('image', 'polygon', 6)}
                  disabled={!canvasReady}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <Hexagon className="h-4 w-4" />
                  <span className="text-xs">Hexagon</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createFrame('image', 'polygon', 8)}
                  disabled={!canvasReady}
                  className="h-auto py-2 flex flex-col items-center gap-1"
                >
                  <Hexagon className="h-4 w-4" />
                  <span className="text-xs">Octagon</span>
                </Button>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-xs"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </CardContent>
      </Card>

      {/* Frame List */}
      {frames.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Frames ({frames.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                  frame.id === selectedFrameId
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => onFrameSelect(frame.id)}
              >
                <div className="flex items-center gap-2">
                  {frame.type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Type className="h-4 w-4 text-green-600" />
                  )}
                  <div className="text-xs">
                    <div className="font-medium">
                      {frame.type === 'image' ? 'Image' : 'Text'} Frame
                    </div>
                    <div className="text-gray-500">
                      {frame.shape} • {frame.width}×{frame.height}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateFrame(frame.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFrame(frame.id);
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Frame Guidelines */}
      {frames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Frame Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-1">
            <p>• <span className="text-blue-600">Blue frames</span> = Image upload areas</p>
            <p>• <span className="text-green-600">Green frames</span> = Text input areas</p>
            <p>• Users will see only the frames, not the background</p>
            <p>• Make frames large enough for content</p>
            <p>• Click and drag to move frames</p>
            <p>• Use handles to resize frames</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {frames.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Layers className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No frames yet</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add image and text frames to create editable areas
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={() => createFrame('image', 'rectangle')}
                disabled={!canvasReady}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Add Image Frame
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createFrame('text', 'rectangle')}
                disabled={!canvasReady}
              >
                <Type className="h-4 w-4 mr-1" />
                Add Text Frame
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 