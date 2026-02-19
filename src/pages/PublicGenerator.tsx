/**
 * Public Generator Page
 * End-user interface for personalizing templates
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, 
  Share2, 
  Eye, 
  ArrowLeft, 
  Upload,
  Type,
  Image as ImageIcon,
  Copy,
  Check,
  QrCode,
  Save,
  RefreshCw,
  FileText,
  Edit,
  BarChart3,
  Sparkles,
  Search,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getPublicTemplate, trackTemplateGeneration } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Template, TemplateWithFrames } from '@/integrations/supabase/types';
import { uploadImage } from '@/lib/supabase';
import { exportCanvasToPDF, getPDFExportOptions } from '@/lib/pdfUtils';
import { addWatermarkToCanvas, shouldApplyWatermark } from '@/lib/watermark';
import { getAvailableFonts, applyFontToContext, waitForFontLoad } from '@/lib/fontUtils';
import { drawBackgroundImage, loadImage, cropImageToFrame, createCroppedCanvas } from '@/lib/imageUtils';
import ImageEditorModal from '@/components/ImageEditorModal';

interface FrameData {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'rounded-rectangle' | 'polygon';
  cornerRadius?: number;
  polygonSides?: number;
  properties?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    placeholder?: string;
    content?: string;
  };
}

interface UserData {
  [frameId: string]: {
    type: 'image' | 'text';
    value: string | File;
    uploadedUrl?: string;
    transformData?: any;
    originalFile?: File; // Store original file for re-editing
  };
}

// Shape drawing helper function (moved outside component to prevent re-renders)
const createShapePath = (ctx: CanvasRenderingContext2D, frame: FrameData) => {
  ctx.beginPath();
  
  switch (frame.shape) {
    case 'circle': {
      const centerX = frame.x + frame.width / 2;
      const centerY = frame.y + frame.height / 2;
      const radius = Math.min(frame.width, frame.height) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      break;
    }
    case 'rounded-rectangle': {
      const cornerRadius = frame.cornerRadius || 10;
      ctx.moveTo(frame.x + cornerRadius, frame.y);
      ctx.lineTo(frame.x + frame.width - cornerRadius, frame.y);
      ctx.quadraticCurveTo(frame.x + frame.width, frame.y, frame.x + frame.width, frame.y + cornerRadius);
      ctx.lineTo(frame.x + frame.width, frame.y + frame.height - cornerRadius);
      ctx.quadraticCurveTo(frame.x + frame.width, frame.y + frame.height, frame.x + frame.width - cornerRadius, frame.y + frame.height);
      ctx.lineTo(frame.x + cornerRadius, frame.y + frame.height);
      ctx.quadraticCurveTo(frame.x, frame.y + frame.height, frame.x, frame.y + frame.height - cornerRadius);
      ctx.lineTo(frame.x, frame.y + cornerRadius);
      ctx.quadraticCurveTo(frame.x, frame.y, frame.x + cornerRadius, frame.y);
      break;
    }
    case 'polygon': {
      const sides = frame.polygonSides || 6;
      const centerX = frame.x + frame.width / 2;
      const centerY = frame.y + frame.height / 2;
      const radius = Math.min(frame.width, frame.height) / 2;
      
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(frame.x, frame.y, frame.width, frame.height);
  }
};

export default function PublicGenerator() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  // Template state
  const [template, setTemplate] = useState<TemplateWithFrames | null>(null);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [creatorName, setCreatorName] = useState<string>('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  // User data state
  const [userData, setUserData] = useState<UserData>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [currentStep, setCurrentStep] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Image editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<FrameData | null>(null);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  // Load template data
  useEffect(() => {
    const loadTemplate = async (retryCount = 0) => {
      // Ensure we set loading true even if we hit common early exits
      if (!templateId) {
          setLoading(false);
          setError("No template ID provided");
          return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Loading template:', templateId);
        const templateData = await getPublicTemplate(templateId);
        
        if (!templateData) {
          throw new Error('Template not found');
        }

        setTemplate(templateData);
        setBackgroundUrl(templateData.background_url || '');
        
        // Set download count from template data
        if (templateData.generation_count) {
          setDownloadCount(templateData.generation_count);
        }
        
        if (templateData.frames && Array.isArray(templateData.frames)) {
          setFrames(templateData.frames as FrameData[]);
          console.log('Frames loaded:', templateData.frames.length);
        } else {
          console.log('No frames found in template');
          setFrames([]);
        }
        
        // Try to get creator name if available
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, subscription_tier')
            .eq('id', templateData.user_id)
            .single();
            
          if (profile && !profileError) {
            setCreatorName(profile.full_name || 'Anonymous Creator');
            setSubscriptionTier(profile.subscription_tier || 'free');
          }
        } catch (profileCatchError) {
          console.warn('Failed to fetch creator info:', profileCatchError);
        }

        // Generate share link
        const link = `${window.location.origin}/flyer/${templateId}`;
        setShareLink(link);

        console.log('Template loading completed successfully');

      } catch (err) {
        console.error('Error loading template:', err);
        
        if (retryCount < 2 && (err instanceof Error && 
            (err.message.includes('timeout') || err.message.includes('network') || err.message.includes('fetch')))) {
          console.log(`Retrying... (${retryCount + 1}/2)`);
          setTimeout(() => loadTemplate(retryCount + 1), 2000);
          return;
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, lastRefresh]);

  // Helper function to resolve image source correctly (string or File)
  const resolveImageSource = useCallback((src: string | File): string => {
    if (typeof src === 'string') return src;
    try {
        return URL.createObjectURL(src);
    } catch (e) {
        console.error('Failed to create object URL for file:', e);
        return '';
    }
  }, []);

  // Render canvas content to a given context (for display and export)
  const renderCanvasToContext = useCallback(async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      if (!backgroundUrl) {
        console.log('No background URL, rendering blank canvas');
        return;
      }

      // Load and draw background image
      try {
        let bgImage = bgImageRef.current;
        if (!bgImage || bgImage.src !== backgroundUrl) {
          bgImage = await loadImage(backgroundUrl);
          bgImageRef.current = bgImage;
        }
        drawBackgroundImage(ctx, bgImage, width, height);
      } catch (bgError) {
        console.error('Failed to load background image:', bgError);
      }

      // Draw user data in frames
      for (const frame of frames) {
        const input = userData[frame.id];
        
        // Ensure we render text frames even if no input yet (for placeholders)
        if (!input && frame.type !== 'text') continue;

        try {
          if (frame.type === 'image') {
            const imageSrc = input.uploadedUrl || input.value;
            const finalSrc = resolveImageSource(imageSrc);
            if (!finalSrc) continue;

            const userImage = await loadImage(finalSrc);
            
            ctx.save();
            
            // Move to frame center and apply rotation
            const centerX = frame.x + frame.width / 2;
            const centerY = frame.y + frame.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((frame.rotation || 0) * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
            
            // Create clipping path for shape
            createShapePath(ctx, frame);
            ctx.clip();
            
            // If it's a data URL (edited image), it's already cropped/transformed
            if (typeof imageSrc === 'string' && imageSrc.startsWith('data:')) {
              ctx.drawImage(userImage, frame.x, frame.y, frame.width, frame.height);
            } else {
              // Standard unedited file - crop to fit
              const crop = cropImageToFrame(userImage, frame.width, frame.height);
              ctx.drawImage(
                userImage,
                crop.sourceX, crop.sourceY, crop.sourceWidth, crop.sourceHeight,
                frame.x, frame.y, crop.drawWidth, crop.drawHeight
              );
            }
            
            ctx.restore();

          } else if (frame.type === 'text') {
            const text = (input?.type === 'text' ? (input.value as string) : '') || frame.properties?.placeholder || '';
            const properties = frame.properties || {};
            const fontFamily = properties.fontFamily || 'Arial';
            const fontSize = properties.fontSize || 24;
            
            ctx.save();
            
            // Move to frame center and apply rotation
            const centerX = frame.x + frame.width / 2;
            const centerY = frame.y + frame.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((frame.rotation || 0) * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
            
            // Create clipping path
            createShapePath(ctx, frame);
            ctx.clip();
            
            // Load and apply font
            if (fontFamily !== 'Arial' && fontFamily !== 'sans-serif') {
              await waitForFontLoad(fontFamily).catch(e => console.warn('Font load timeout:', e));
            }

            applyFontToContext(ctx, fontFamily, fontSize);
            ctx.fillStyle = properties.color || '#000000';
            ctx.textAlign = (properties.textAlign as CanvasTextAlign) || 'center';
            ctx.textBaseline = 'middle';

            // Calculate text alignment position
            const textX = (properties.textAlign === 'left') ? frame.x + 10 : 
                          (properties.textAlign === 'right') ? frame.x + frame.width - 10 : 
                          frame.x + frame.width / 2;
            
            // Word wrapping logic
            const words = text.split(/\s+/);
            const lineHeight = fontSize * 1.2;
            const maxLines = Math.floor(frame.height / lineHeight) || 1;
            
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const metrics = ctx.measureText(testLine);
              if (metrics.width > frame.width - 20 && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);

            const finalLines = lines.slice(0, maxLines);
            const totalHeight = finalLines.length * lineHeight;
            const startY = frame.y + (frame.height - totalHeight) / 2 + lineHeight / 2;

            finalLines.forEach((line, index) => {
              ctx.fillText(line, textX, startY + (index * lineHeight));
            });
            
            ctx.restore();
          }
        } catch (frameError) {
          console.error(`Error rendering frame ${frame.id}:`, frameError);
          ctx.restore(); // Ensure context is restored on error
        }
      }
    } catch (globalError) {
      console.error('Fatal error in renderCanvasToContext:', globalError);
    }
  }, [backgroundUrl, frames, userData, resolveImageSource]);

  // Canvas display logic with DPR support
  const initializeCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1;
    // We keep style-based sizing for responsiveness
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    return ctx;
  }, []);

  // Main render loop for the display canvas
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const baseWidth = 1200;
    const baseHeight = 800;
    
    const ctx = initializeCanvas(canvas, baseWidth, baseHeight);
    if (!ctx) return;
    
    await renderCanvasToContext(ctx, baseWidth, baseHeight);
  }, [renderCanvasToContext, initializeCanvas]);

  // Effect to re-render when anything meaningful changes
  useEffect(() => {
    if (!loading && template) {
      // Small delay to ensure browser has calculated layout
      const timer = setTimeout(() => {
        renderCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [renderCanvas, userData, backgroundUrl, frames, loading, template]);

  // Handle file selection from step 2
  const handleFileUpload = async (frameId: string, file: File) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;
    setEditingFrame(frame);
    setEditingImageFile(file);
    setImageEditorOpen(true);
  };

  // Handle image editor completion
  const handleImageEditorComplete = (editedImageUrl: string, transformData: any) => {
    if (!editingFrame) return;

    setUserData(prev => ({
      ...prev,
      [editingFrame.id]: {
        type: 'image',
        value: editedImageUrl,
        uploadedUrl: editedImageUrl,
        transformData,
        originalFile: editingImageFile || undefined
      }
    }));

    setImageEditorOpen(false);
    setEditingFrame(null);
    setEditingImageFile(null);
    toast.success('Image applied successfully');
  };

  // Handle text input
  const handleTextInput = (frameId: string, text: string) => {
    setUserData(prev => ({
      ...prev,
      [frameId]: {
        type: 'text',
        value: text
      }
    }));
  };

  // Generate and download personalized design
  const handleDownload = async () => {
    setGenerating(true);
    try {
      // Create high-resolution export canvas
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('Failed to get export canvas context');
      
      const scale = 2; // 2x for better quality
      const baseWidth = 1200;
      const baseHeight = 800;
      exportCanvas.width = baseWidth * scale;
      exportCanvas.height = baseHeight * scale;
      
      exportCtx.scale(scale, scale);
      
      await renderCanvasToContext(exportCtx, baseWidth, baseHeight);
      
      // Load background image for cropping to content bounds
      const bgImage = await loadImage(backgroundUrl);
      const croppedCanvas = createCroppedCanvas(exportCanvas, bgImage);
      
      // Apply watermark if on free tier
      const finalCanvas = shouldApplyWatermark(subscriptionTier) ? 
        addWatermarkToCanvas(croppedCanvas, 'free', creatorName) : croppedCanvas;
      
      const dataURL = finalCanvas.toDataURL('image/png', 1.0);
      
      // Track generation
      if (template?.id) {
        try {
          await trackTemplateGeneration(template.id);
          setDownloadCount(prev => prev + 1);
        } catch (e) {
          console.warn('Failed to track generation:', e);
        }
      }
      
      const link = document.createElement('a');
      link.download = `${template?.name || 'personalized-flyer'}.png`;
      link.href = dataURL;
      link.click();

      toast.success('Design downloaded successfully!');
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error('Failed to generate design');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setGenerating(true);
    try {
      const filename = `${template?.name || 'personalized-flyer'}.pdf`;
      await exportCanvasToPDF(canvasRef.current, {
        width: 1200,
        height: 800,
        quality: 1.0,
        format: 'A4',
        orientation: 'portrait',
        filename
      });
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setGenerating(false);
    }
  };

  const steps = [
    { id: 1, name: 'Details', icon: '📝' },
    { id: 2, name: 'Photo', icon: '🖼️' },
    { id: 3, name: 'Review', icon: '✨' },
    { id: 4, name: 'Get it', icon: '📥' }
  ];

  const textFrames = frames.filter(f => f.type === 'text');
  const imageFrames = frames.filter(f => f.type === 'image');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1318] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Preparing Your Design</h2>
          <p className="text-white/40">Almost ready...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-[#0E1318] flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-[#141A21] border-white/5 p-8 text-center rounded-[32px]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-white/60 mb-8">{error || 'Template not found'}</p>
          <Button onClick={() => navigate('/')} className="w-full bg-amber-500 hover:bg-amber-600">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1318] text-white flex flex-col font-sans">
      {/* Background Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center select-none overflow-hidden">
        <h1 className="text-[25vw] font-black rotate-[-15deg] whitespace-nowrap">INFINITY GENERATION</h1>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#141A21]/80 backdrop-blur-xl sticky top-0 z-50 px-4">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
            <h1 className="font-bold text-lg truncate max-w-[200px] sm:max-w-none">{template.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">
              Customizer Pro
            </Badge>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 relative z-10 transition-all">
        
        {/* Left: Design Preview */}
        <div className="flex-1 flex flex-col gap-6 lg:min-h-0">
          {/* Progress Desktop */}
          <div className="bg-[#141A21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex items-center justify-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= step.id ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-[#1C242C] text-white/20 border border-white/5'
                }`}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= step.id ? 'text-amber-500' : 'text-white/20'}`}>
                  {step.name}
                </span>
                {step.id < steps.length && <div className="w-4 sm:w-8 h-[1px] bg-white/5" />}
              </div>
            ))}
          </div>

          {/* Canvas Viewport */}
          <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 group min-h-[400px]">
            <div className="relative transform-gpu transition-all duration-300 shadow-2xl w-full max-w-[1200px] aspect-[3/2]" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}>
              <canvas ref={canvasRef} className="rounded-lg bg-white shadow-2xl w-full h-full block" />
            </div>

            {/* View Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><Search className="h-4 w-4 rotate-[-90deg]" /></Button>
              <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60" onClick={() => setZoom(Math.min(3, zoom + 0.1))}><Search className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-4 bg-white/10" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60" onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}><Maximize2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60" onClick={renderCanvas}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Right: Step Interaction Card */}
        <div className="w-full lg:w-[420px] flex flex-col shrink-0">
          <Card className="bg-[#141A21] border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl h-full backdrop-blur-md text-white">
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="mb-8">
                <Badge className="mb-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0">STEP {currentStep}</Badge>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent">
                  {currentStep === 1 ? 'Personal Details' : 
                   currentStep === 2 ? 'Add Your Image' : 
                   currentStep === 3 ? 'Review Design' : 'Final Step'}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  {currentStep === 1 ? 'Enter the text you want on your flyer.' : 
                   currentStep === 2 ? 'Upload or change your profile image.' : 
                   currentStep === 3 ? 'Check everything looks perfect.' : 'Download your high-resolution flyer.'}
                </p>
              </div>

              {/* Steps Content */}
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {textFrames.length > 0 ? textFrames.map((frame) => (
                      <div key={frame.id} className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                          <Type className="h-3 w-3" /> {frame.properties?.placeholder || 'Detail'}
                        </Label>
                        <Input
                          value={userData[frame.id]?.value as string || ''}
                          onChange={(e) => handleTextInput(frame.id, e.target.value)}
                          placeholder="Type something..."
                          className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-amber-500/50 transition-all placeholder:text-white/30"
                        />
                      </div>
                    )) : (
                      <div className="py-8 text-center text-white/20 border border-dashed border-white/5 rounded-2xl">
                        <Type className="h-8 w-8 mx-auto mb-2 opacity-10" />
                        <p className="text-xs">No text areas in this template.</p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    {imageFrames.length > 0 ? imageFrames.map((frame) => (
                      <div key={frame.id} className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <ImageIcon className="h-3 w-3" /> Photo Layer {frame.id.slice(-4)}
                        </Label>
                        <div 
                          className="relative aspect-video rounded-2xl border border-white/5 bg-black/40 overflow-hidden group cursor-pointer"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleFileUpload(frame.id, file);
                            };
                            input.click();
                          }}
                        >
                          {userData[frame.id]?.value ? (
                            <img src={resolveImageSource(userData[frame.id].value)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5"><Upload className="h-5 w-5 text-white/20" /></div>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Select Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button variant="outline" className="rounded-full bg-white/5">Change</Button></div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-8 text-center text-white/20 border border-dashed border-white/5 rounded-2xl">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-10" />
                        <p className="text-xs">No image areas in this template.</p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                      <Sparkles className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Looking Sharp!</h3>
                    <p className="text-white/60 text-sm">Review your design. You can still go back to make changes if needed.</p>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 flex flex-col items-center pt-6">
                    <div className="w-24 h-24 bg-green-500/10 rounded-[40px] flex items-center justify-center border border-green-500/20 rotate-12 mb-4">
                        <Check className="h-10 w-10 text-green-500 -rotate-12" />
                    </div>
                    <Button 
                      onClick={handleDownload} 
                      disabled={generating}
                      className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-bold text-lg flex gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      {generating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      Download Design
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={handleExportPDF} 
                        disabled={generating}
                        className="w-full h-12 text-white/60 hover:text-white"
                    >
                        Export as PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation */}
            {currentStep < 4 && (
              <div className="p-6 sm:p-8 border-t border-white/5 flex items-center gap-4 bg-[#181F27]/50 backdrop-blur-md">
                <Button variant="ghost" disabled={currentStep === 1} onClick={() => setCurrentStep(prev => prev - 1)} className="text-white/60">Back</Button>
                <Button onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 font-bold rounded-xl shadow-lg shadow-amber-900/20">
                  {currentStep === 3 ? 'Finalize' : 'Continue'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>

      <ImageEditorModal
        open={imageEditorOpen}
        onClose={() => { setImageEditorOpen(false); setEditingFrame(null); }}
        imageFile={editingImageFile}
        frame={editingFrame!}
        onApply={handleImageEditorComplete}
        previousTransformData={editingFrame ? userData[editingFrame.id]?.transformData : undefined}
      />
    </div>
  );
}
