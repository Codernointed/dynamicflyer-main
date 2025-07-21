
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (value: number) => void;
  onReset?: () => void;
  minZoom?: number;
  maxZoom?: number;
  onFitToView?: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomChange,
  onReset,
  minZoom = 0.25, // Default minimum zoom
  maxZoom = 2,
  onFitToView
}) => {
  const isMobile = useIsMobile();

  // Auto-fit on mobile
  React.useEffect(() => {
    if (isMobile && onFitToView) {
      onFitToView();
    }
  }, [isMobile, onFitToView]);
  
  // Reset handler that resets to minimum zoom
  const handleReset = () => {
    if (onReset) {
      onReset(); // Call original reset function
    } else {
      onZoomChange(minZoom); // Reset to minimum zoom if no reset handler provided
    }
  };
  
  return (
    <div className="flex items-center gap-2 sm:gap-4 p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onZoomChange(Math.max(minZoom, zoom - (isMobile ? 0.05 : 0.1)))}
        className="h-8 w-8"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Slider
        value={[zoom]}
        min={minZoom}
        max={maxZoom}
        step={0.05}
        onValueChange={(values) => onZoomChange(values[0])}
        className={isMobile ? "w-24" : "w-32"}
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onZoomChange(Math.min(maxZoom, zoom + (isMobile ? 0.05 : 0.1)))}
        className="h-8 w-8"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onFitToView}
        className="h-8 w-8"
        title="Fit to view"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleReset}
        className="h-8 w-8"
        title="Reset to minimum zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CanvasControls;
