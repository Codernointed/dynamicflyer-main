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
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical
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
import SearchableFontPicker from './SearchableFontPicker';

interface EnhancedPropertiesPanelProps {
  frame: FrameData;
  onFrameUpdate?: (frameId: string, updates: Partial<FrameData>) => void;
  onFrameDelete?: (frameId: string) => void;
  onFrameDuplicate?: (frameId: string) => void;
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial', style: 'font-family: Arial, sans-serif;' },
  { value: 'Helvetica', label: 'Helvetica', style: 'font-family: Helvetica, sans-serif;' },
  { value: 'Times New Roman', label: 'Times New Roman', style: 'font-family: "Times New Roman", serif;' },
  { value: 'Georgia', label: 'Georgia', style: 'font-family: Georgia, serif;' },
  { value: 'Verdana', label: 'Verdana', style: 'font-family: Verdana, sans-serif;' },
  { value: 'Tahoma', label: 'Tahoma', style: 'font-family: Tahoma, sans-serif;' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', style: 'font-family: "Trebuchet MS", sans-serif;' },
  { value: 'Impact', label: 'Impact', style: 'font-family: Impact, sans-serif;' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS', style: 'font-family: "Comic Sans MS", cursive;' },
  { value: 'Courier New', label: 'Courier New', style: 'font-family: "Courier New", monospace;' },
  { value: 'Arial Black', label: 'Arial Black', style: 'font-family: "Arial Black", sans-serif;' },
  { value: 'Lucida Console', label: 'Lucida Console', style: 'font-family: "Lucida Console", monospace;' },
  { value: 'Lucida Sans Unicode', label: 'Lucida Sans Unicode', style: 'font-family: "Lucida Sans Unicode", sans-serif;' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype', style: 'font-family: "Palatino Linotype", serif;' },
  { value: 'Book Antiqua', label: 'Book Antiqua', style: 'font-family: "Book Antiqua", serif;' },
  { value: 'Garamond', label: 'Garamond', style: 'font-family: Garamond, serif;' },
  { value: 'Century Gothic', label: 'Century Gothic', style: 'font-family: "Century Gothic", sans-serif;' },
  { value: 'Franklin Gothic Medium', label: 'Franklin Gothic Medium', style: 'font-family: "Franklin Gothic Medium", sans-serif;' },
  { value: 'Brush Script MT', label: 'Brush Script MT', style: 'font-family: "Brush Script MT", cursive;' },
  { value: 'Copperplate', label: 'Copperplate', style: 'font-family: Copperplate, serif;' },
  { value: 'Papyrus', label: 'Papyrus', style: 'font-family: Papyrus, fantasy;' },
  { value: 'Futura', label: 'Futura', style: 'font-family: Futura, sans-serif;' },
  { value: 'Optima', label: 'Optima', style: 'font-family: Optima, sans-serif;' },
  { value: 'Bodoni MT', label: 'Bodoni MT', style: 'font-family: "Bodoni MT", serif;' },
  { value: 'Didot', label: 'Didot', style: 'font-family: Didot, serif;' },
  { value: 'Baskerville', label: 'Baskerville', style: 'font-family: Baskerville, serif;' },
  { value: 'Futura Condensed', label: 'Futura Condensed', style: 'font-family: "Futura Condensed", sans-serif;' },
  { value: 'Gill Sans', label: 'Gill Sans', style: 'font-family: "Gill Sans", sans-serif;' },
  { value: 'Myriad Pro', label: 'Myriad Pro', style: 'font-family: "Myriad Pro", sans-serif;' },
  { value: 'Minion Pro', label: 'Minion Pro', style: 'font-family: "Minion Pro", serif;' },
  { value: 'Trajan Pro', label: 'Trajan Pro', style: 'font-family: "Trajan Pro", serif;' },
  { value: 'Futura PT', label: 'Futura PT', style: 'font-family: "Futura PT", sans-serif;' },
  { value: 'Proxima Nova', label: 'Proxima Nova', style: 'font-family: "Proxima Nova", sans-serif;' },
  { value: 'Gotham', label: 'Gotham', style: 'font-family: Gotham, sans-serif;' },
  { value: 'DIN', label: 'DIN', style: 'font-family: DIN, sans-serif;' },
  { value: 'Univers', label: 'Univers', style: 'font-family: Univers, sans-serif;' },
  { value: 'Akzidenz Grotesk', label: 'Akzidenz Grotesk', style: 'font-family: "Akzidenz Grotesk", sans-serif;' },
  { value: 'Trade Gothic', label: 'Trade Gothic', style: 'font-family: "Trade Gothic", sans-serif;' },
  { value: 'News Gothic', label: 'News Gothic', style: 'font-family: "News Gothic", sans-serif;' },
  { value: 'Franklin Gothic', label: 'Franklin Gothic', style: 'font-family: "Franklin Gothic", sans-serif;' },
  { value: 'Alternate Gothic', label: 'Alternate Gothic', style: 'font-family: "Alternate Gothic", sans-serif;' },
  { value: 'Bureau Grot', label: 'Bureau Grot', style: 'font-family: "Bureau Grot", sans-serif;' },
  { value: 'Champion', label: 'Champion', style: 'font-family: Champion, sans-serif;' },
  { value: 'Tungsten', label: 'Tungsten', style: 'font-family: Tungsten, sans-serif;' },
  { value: 'Whitney', label: 'Whitney', style: 'font-family: Whitney, sans-serif;' },
  { value: 'Inter', label: 'Inter', style: 'font-family: Inter, sans-serif;' },
  { value: 'Roboto', label: 'Roboto', style: 'font-family: Roboto, sans-serif;' },
  { value: 'Open Sans', label: 'Open Sans', style: 'font-family: "Open Sans", sans-serif;' },
  { value: 'Lato', label: 'Lato', style: 'font-family: Lato, sans-serif;' },
  { value: 'Poppins', label: 'Poppins', style: 'font-family: Poppins, sans-serif;' },
  { value: 'Montserrat', label: 'Montserrat', style: 'font-family: Montserrat, sans-serif;' },
  { value: 'Raleway', label: 'Raleway', style: 'font-family: Raleway, sans-serif;' },
  { value: 'Nunito', label: 'Nunito', style: 'font-family: Nunito, sans-serif;' },
  { value: 'Ubuntu', label: 'Ubuntu', style: 'font-family: Ubuntu, sans-serif;' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', style: 'font-family: "Source Sans Pro", sans-serif;' },
  { value: 'Merriweather', label: 'Merriweather', style: 'font-family: Merriweather, serif;' },
  { value: 'Playfair Display', label: 'Playfair Display', style: 'font-family: "Playfair Display", serif;' },
  { value: 'Lora', label: 'Lora', style: 'font-family: Lora, serif;' },
  { value: 'Crimson Text', label: 'Crimson Text', style: 'font-family: "Crimson Text", serif;' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', style: 'font-family: "Libre Baskerville", serif;' },
  { value: 'Source Code Pro', label: 'Source Code Pro', style: 'font-family: "Source Code Pro", monospace;' },
  { value: 'Fira Code', label: 'Fira Code', style: 'font-family: "Fira Code", monospace;' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', style: 'font-family: "JetBrains Mono", monospace;' },
  { value: 'Cascadia Code', label: 'Cascadia Code', style: 'font-family: "Cascadia Code", monospace;' },
  { value: 'Inconsolata', label: 'Inconsolata', style: 'font-family: Inconsolata, monospace;' },
  { value: 'Space Mono', label: 'Space Mono', style: 'font-family: "Space Mono", monospace;' },
  { value: 'Roboto Mono', label: 'Roboto Mono', style: 'font-family: "Roboto Mono", monospace;' },
  { value: 'Dancing Script', label: 'Dancing Script', style: 'font-family: "Dancing Script", cursive;' },
  { value: 'Pacifico', label: 'Pacifico', style: 'font-family: Pacifico, cursive;' },
  { value: 'Great Vibes', label: 'Great Vibes', style: 'font-family: "Great Vibes", cursive;' },
  { value: 'Satisfy', label: 'Satisfy', style: 'font-family: Satisfy, cursive;' },
  { value: 'Kaushan Script', label: 'Kaushan Script', style: 'font-family: "Kaushan Script", cursive;' },
  { value: 'Allura', label: 'Allura', style: 'font-family: Allura, cursive;' },
  { value: 'Alex Brush', label: 'Alex Brush', style: 'font-family: "Alex Brush", cursive;' },
  { value: 'Tangerine', label: 'Tangerine', style: 'font-family: Tangerine, cursive;' },
  { value: 'Caveat', label: 'Caveat', style: 'font-family: Caveat, cursive;' },
  { value: 'Indie Flower', label: 'Indie Flower', style: 'font-family: "Indie Flower", cursive;' },
  { value: 'Shadows Into Light', label: 'Shadows Into Light', style: 'font-family: "Shadows Into Light", cursive;' },
  { value: 'Permanent Marker', label: 'Permanent Marker', style: 'font-family: "Permanent Marker", cursive;' },
  { value: 'Rock Salt', label: 'Rock Salt', style: 'font-family: "Rock Salt", cursive;' },
  { value: 'Homemade Apple', label: 'Homemade Apple', style: 'font-family: "Homemade Apple", cursive;' },
  { value: 'Kalam', label: 'Kalam', style: 'font-family: Kalam, cursive;' },
  { value: 'Reenie Beanie', label: 'Reenie Beanie', style: 'font-family: "Reenie Beanie", cursive;' },
  { value: 'Architects Daughter', label: 'Architects Daughter', style: 'font-family: "Architects Daughter", cursive;' },
  { value: 'Just Another Hand', label: 'Just Another Hand', style: 'font-family: "Just Another Hand", cursive;' },
  { value: 'Patrick Hand', label: 'Patrick Hand', style: 'font-family: "Patrick Hand", cursive;' },
  { value: 'Coming Soon', label: 'Coming Soon', style: 'font-family: "Coming Soon", cursive;' },
  { value: 'Short Stack', label: 'Short Stack', style: 'font-family: "Short Stack", cursive;' },
  { value: 'Gloria Hallelujah', label: 'Gloria Hallelujah', style: 'font-family: "Gloria Hallelujah", cursive;' },
  { value: 'Bangers', label: 'Bangers', style: 'font-family: Bangers, cursive;' },
  { value: 'Fredoka One', label: 'Fredoka One', style: 'font-family: "Fredoka One", cursive;' },
  { value: 'Chewy', label: 'Chewy', style: 'font-family: Chewy, cursive;' },
  { value: 'Bubblegum Sans', label: 'Bubblegum Sans', style: 'font-family: "Bubblegum Sans", cursive;' },
  { value: 'Comic Neue', label: 'Comic Neue', style: 'font-family: "Comic Neue", cursive;' },
  { value: 'Sniglet', label: 'Sniglet', style: 'font-family: Sniglet, cursive;' },
  { value: 'Freckle Face', label: 'Freckle Face', style: 'font-family: "Freckle Face", cursive;' },
  { value: 'Boogaloo', label: 'Boogaloo', style: 'font-family: Boogaloo, cursive;' },
  { value: 'Bevan', label: 'Bevan', style: 'font-family: Bevan, cursive;' },
  { value: 'Righteous', label: 'Righteous', style: 'font-family: Righteous, cursive;' },
  { value: 'Lobster', label: 'Lobster', style: 'font-family: Lobster, cursive;' },
  { value: 'Lobster Two', label: 'Lobster Two', style: 'font-family: "Lobster Two", cursive;' },
  { value: 'Creepster', label: 'Creepster', style: 'font-family: Creepster, cursive;' },
  { value: 'Fascinate', label: 'Fascinate', style: 'font-family: Fascinate, cursive;' },
  { value: 'Fascinate Inline', label: 'Fascinate Inline', style: 'font-family: "Fascinate Inline", cursive;' },
  { value: 'Abril Fatface', label: 'Abril Fatface', style: 'font-family: "Abril Fatface", cursive;' },
  { value: 'UnifrakturMaguntia', label: 'UnifrakturMaguntia', style: 'font-family: UnifrakturMaguntia, cursive;' },
  { value: 'UnifrakturCook', label: 'UnifrakturCook', style: 'font-family: UnifrakturCook, cursive;' },
  { value: 'Unkempt', label: 'Unkempt', style: 'font-family: Unkempt, cursive;' },
  { value: 'Sancreek', label: 'Sancreek', style: 'font-family: Sancreek, cursive;' },
  { value: 'Crafty Girls', label: 'Crafty Girls', style: 'font-family: "Crafty Girls", cursive;' },
  { value: 'Calligraffitti', label: 'Calligraffitti', style: 'font-family: Calligraffitti, cursive;' },
  { value: 'Cherry Cream Soda', label: 'Cherry Cream Soda', style: 'font-family: "Cherry Cream Soda", cursive;' },
  { value: 'Chewy', label: 'Chewy', style: 'font-family: Chewy, cursive;' },
  { value: 'Sunshiney', label: 'Sunshiney', style: 'font-family: Sunshiney, cursive;' },
  { value: 'Loved by the King', label: 'Loved by the King', style: 'font-family: "Loved by the King", cursive;' },
  { value: 'Over the Rainbow', label: 'Over the Rainbow', style: 'font-family: "Over the Rainbow", cursive;' },
  { value: 'Swanky and Moo Moo', label: 'Swanky and Moo Moo', style: 'font-family: "Swanky and Moo Moo", cursive;' },
  { value: 'Miss Fajardose', label: 'Miss Fajardose', style: 'font-family: "Miss Fajardose", cursive;' },
  { value: 'Aguafina Script', label: 'Aguafina Script', style: 'font-family: "Aguafina Script", cursive;' },
  { value: 'Qwigley', label: 'Qwigley', style: 'font-family: Qwigley, cursive;' },
  { value: 'Dynalight', label: 'Dynalight', style: 'font-family: Dynalight, cursive;' },
  { value: 'Rouge Script', label: 'Rouge Script', style: 'font-family: "Rouge Script", cursive;' },
  { value: 'Satisfy', label: 'Satisfy', style: 'font-family: Satisfy, cursive;' },
  { value: 'Kaushan Script', label: 'Kaushan Script', style: 'font-family: "Kaushan Script", cursive;' },
  { value: 'Allura', label: 'Allura', style: 'font-family: Allura, cursive;' },
  { value: 'Alex Brush', label: 'Alex Brush', style: 'font-family: "Alex Brush", cursive;' },
  { value: 'Tangerine', label: 'Tangerine', style: 'font-family: Tangerine, cursive;' },
  { value: 'Caveat', label: 'Caveat', style: 'font-family: Caveat, cursive;' },
  { value: 'Indie Flower', label: 'Indie Flower', style: 'font-family: "Indie Flower", cursive;' },
  { value: 'Shadows Into Light', label: 'Shadows Into Light', style: 'font-family: "Shadows Into Light", cursive;' },
  { value: 'Permanent Marker', label: 'Permanent Marker', style: 'font-family: "Permanent Marker", cursive;' },
  { value: 'Rock Salt', label: 'Rock Salt', style: 'font-family: "Rock Salt", cursive;' },
  { value: 'Homemade Apple', label: 'Homemade Apple', style: 'font-family: "Homemade Apple", cursive;' },
  { value: 'Kalam', label: 'Kalam', style: 'font-family: Kalam, cursive;' },
  { value: 'Reenie Beanie', label: 'Reenie Beanie', style: 'font-family: "Reenie Beanie", cursive;' },
  { value: 'Architects Daughter', label: 'Architects Daughter', style: 'font-family: "Architects Daughter", cursive;' },
  { value: 'Just Another Hand', label: 'Just Another Hand', style: 'font-family: "Just Another Hand", cursive;' },
  { value: 'Patrick Hand', label: 'Patrick Hand', style: 'font-family: "Patrick Hand", cursive;' },
  { value: 'Coming Soon', label: 'Coming Soon', style: 'font-family: "Coming Soon", cursive;' },
  { value: 'Short Stack', label: 'Short Stack', style: 'font-family: "Short Stack", cursive;' },
  { value: 'Gloria Hallelujah', label: 'Gloria Hallelujah', style: 'font-family: "Gloria Hallelujah", cursive;' },
  { value: 'Bangers', label: 'Bangers', style: 'font-family: Bangers, cursive;' },
  { value: 'Fredoka One', label: 'Fredoka One', style: 'font-family: "Fredoka One", cursive;' },
  { value: 'Chewy', label: 'Chewy', style: 'font-family: Chewy, cursive;' },
  { value: 'Bubblegum Sans', label: 'Bubblegum Sans', style: 'font-family: "Bubblegum Sans", cursive;' },
  { value: 'Comic Neue', label: 'Comic Neue', style: 'font-family: "Comic Neue", cursive;' },
  { value: 'Sniglet', label: 'Sniglet', style: 'font-family: Sniglet, cursive;' },
  { value: 'Freckle Face', label: 'Freckle Face', style: 'font-family: "Freckle Face", cursive;' },
  { value: 'Boogaloo', label: 'Boogaloo', style: 'font-family: Boogaloo, cursive;' },
  { value: 'Bevan', label: 'Bevan', style: 'font-family: Bevan, cursive;' },
  { value: 'Righteous', label: 'Righteous', style: 'font-family: Righteous, cursive;' },
  { value: 'Lobster', label: 'Lobster', style: 'font-family: Lobster, cursive;' },
  { value: 'Lobster Two', label: 'Lobster Two', style: 'font-family: "Lobster Two", cursive;' },
  { value: 'Creepster', label: 'Creepster', style: 'font-family: Creepster, cursive;' },
  { value: 'Fascinate', label: 'Fascinate', style: 'font-family: Fascinate, cursive;' },
  { value: 'Fascinate Inline', label: 'Fascinate Inline', style: 'font-family: "Fascinate Inline", cursive;' },
  { value: 'Abril Fatface', label: 'Abril Fatface', style: 'font-family: "Abril Fatface", cursive;' },
  { value: 'UnifrakturMaguntia', label: 'UnifrakturMaguntia', style: 'font-family: UnifrakturMaguntia, cursive;' },
  { value: 'UnifrakturCook', label: 'UnifrakturCook', style: 'font-family: UnifrakturCook, cursive;' },
  { value: 'Unkempt', label: 'Unkempt', style: 'font-family: Unkempt, cursive;' },
  { value: 'Sancreek', label: 'Sancreek', style: 'font-family: Sancreek, cursive;' },
  { value: 'Crafty Girls', label: 'Crafty Girls', style: 'font-family: "Crafty Girls", cursive;' },
  { value: 'Calligraffitti', label: 'Calligraffitti', style: 'font-family: Calligraffitti, cursive;' },
  { value: 'Cherry Cream Soda', label: 'Cherry Cream Soda', style: 'font-family: "Cherry Cream Soda", cursive;' },
  { value: 'Sunshiney', label: 'Sunshiney', style: 'font-family: Sunshiney, cursive;' },
  { value: 'Loved by the King', label: 'Loved by the King', style: 'font-family: "Loved by the King", cursive;' },
  { value: 'Over the Rainbow', label: 'Over the Rainbow', style: 'font-family: "Over the Rainbow", cursive;' },
  { value: 'Swanky and Moo Moo', label: 'Swanky and Moo Moo', style: 'font-family: "Swanky and Moo Moo", cursive;' },
  { value: 'Miss Fajardose', label: 'Miss Fajardose', style: 'font-family: "Miss Fajardose", cursive;' },
  { value: 'Aguafina Script', label: 'Aguafina Script', style: 'font-family: "Aguafina Script", cursive;' },
  { value: 'Qwigley', label: 'Qwigley', style: 'font-family: Qwigley, cursive;' },
  { value: 'Dynalight', label: 'Dynalight', style: 'font-family: Dynalight, cursive;' },
  { value: 'Rouge Script', label: 'Rouge Script', style: 'font-family: "Rouge Script", cursive;' }
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
                <SearchableFontPicker
                  fonts={FONT_FAMILIES}
                  value={localFrame.properties?.fontFamily || 'Arial'}
                  onValueChange={(value) => updateFrame({
                    properties: { ...localFrame.properties, fontFamily: value }
                  })}
                />
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
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={localFrame.properties?.color || '#000000'}
                    onChange={(e) => updateFrame({
                      properties: { ...localFrame.properties, color: e.target.value }
                    })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    type="text"
                    value={localFrame.properties?.color || '#000000'}
                    onChange={(e) => updateFrame({
                      properties: { ...localFrame.properties, color: e.target.value }
                    })}
                    className="h-8 flex-1"
                  />
                </div>
                <div className="grid grid-cols-6 gap-1 mt-2">
                  {['#000000', '#ffffff', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#9ca3af', '#4b5563', '#1f2937'].map((color) => (
                    <button
                      key={color}
                      className={`h-6 w-full rounded border border-gray-200 transition-transform active:scale-95 ${localFrame.properties?.color === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateFrame({
                        properties: { ...localFrame.properties, color: color }
                      })}
                    />
                  ))}
                </div>
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

      {/* Quick Actions & Alignment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions & Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Horizontal Alignment */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-400 uppercase tracking-wider">Horizontal Alignment</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ x: 0 })}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ x: 1200 / 2 - localFrame.width / 2 })}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ x: 1200 - localFrame.width })}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Vertical Alignment */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-400 uppercase tracking-wider">Vertical Alignment</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ y: 0 })}
                title="Align Top"
              >
                <AlignStartVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ y: 800 / 2 - localFrame.height / 2 })}
                title="Align Middle"
              >
                <AlignCenterVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={() => updateFrame({ y: 800 - localFrame.height })}
                title="Align Bottom"
              >
                <AlignEndVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFrame({ rotation: 0 })}
              className="h-8 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1.5" />
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
                className="h-8 text-xs"
              >
                Reset Style
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}