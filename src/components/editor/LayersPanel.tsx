import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Lock, Unlock, GripVertical, Trash2, MousePointer2, Type, Image as ImageIcon, Layers } from 'lucide-react';
import { FrameData } from './EnhancedCanvasEditor';
import { Reorder } from 'framer-motion';

interface LayersPanelProps {
  frames: FrameData[];
  selectedFrameId: string | null;
  onFrameSelect: (id: string | null) => void;
  onFramesChange: (frames: FrameData[]) => void;
  onAddFrame?: (type: 'image' | 'text') => void;
}

export default function LayersPanel({
  frames,
  selectedFrameId,
  onFrameSelect,
  onFramesChange,
  onAddFrame
}: LayersPanelProps) {
  
  // Stacking order: top of array is top of stack
  // Reorder component needs a unique key
  const handleReorder = (newOrder: FrameData[]) => {
    onFramesChange(newOrder);
  };

  const toggleVisibility = (id: string) => {
    onFramesChange(frames.map(f => 
      f.id === id ? { ...f, visible: f.visible === false } : f
    ));
  };

  const toggleLock = (id: string) => {
    onFramesChange(frames.map(f => 
      f.id === id ? { ...f, locked: !f.locked } : f
    ));
  };

  const deleteLayer = (id: string) => {
    onFramesChange(frames.filter(f => f.id !== id));
    if (selectedFrameId === id) onFrameSelect(null);
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Section */}
      <div className="grid grid-cols-2 gap-2 p-1">
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-3 bg-white hover:bg-slate-50 border-slate-200 flex flex-col gap-1.5 shadow-sm"
          onClick={() => onAddFrame?.('image')}
        >
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Image</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-3 bg-white hover:bg-slate-50 border-slate-200 flex flex-col gap-1.5 shadow-sm"
          onClick={() => onAddFrame?.('text')}
        >
          <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
            <Type className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Text</span>
        </Button>
      </div>

      <Separator className="opacity-50" />

      <div className="space-y-2 px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Canvas Layers ({frames.length})
        </p>
      </div>

      <Reorder.Group 
        axis="y" 
        values={frames} 
        onReorder={handleReorder}
        className="space-y-1"
      >
        {[...frames].reverse().map((frame) => (
          <Reorder.Item 
            key={frame.id} 
            value={frame}
            className={`
              group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
              ${selectedFrameId === frame.id 
                ? 'bg-amber-50 border-amber-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-300'}
            `}
            onClick={() => onFrameSelect(frame.id)}
          >
            <div className="flex-none p-0.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-none h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
              {frame.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Type className="h-4 w-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-700">
                {frame.type === 'text' 
                  ? (frame.properties?.placeholder || 'Text Layer') 
                  : (frame.id.split('_').pop() || 'Image Layer')}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {Math.round(frame.width)} × {Math.round(frame.height)}
              </p>
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${frame.visible === false ? 'text-red-500' : 'text-slate-400'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(frame.id);
                }}
                title={frame.visible === false ? "Show Layer" : "Hide Layer"}
              >
                {frame.visible === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${frame.locked ? 'text-amber-600' : 'text-slate-400'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(frame.id);
                }}
                title={frame.locked ? "Unlock Layer" : "Lock Layer"}
              >
                {frame.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(frame.id);
                }}
                title="Delete Layer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {frames.length === 0 && (
        <div className="py-8 text-center bg-white border border-dashed rounded-lg">
          <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">No layers yet</p>
        </div>
      )}
    </div>
  );
}
