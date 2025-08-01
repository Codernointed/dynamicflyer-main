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
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getPublicTemplate } from '@/lib/supabase';
import { Template, TemplateWithFrames } from '@/integrations/supabase/types';
import { uploadImage } from '@/lib/supabase';
import { exportCanvasToPDF, getPDFExportOptions } from '@/lib/pdfUtils';
import { getAvailableFonts, applyFontToContext } from '@/lib/fontUtils';
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
  };
}

export default function PublicGenerator() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  // Template state
  const [template, setTemplate] = useState<TemplateWithFrames | null>(null);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User data state
  const [userData, setUserData] = useState<UserData>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Image editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<FrameData | null>(null);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  // Shape drawing helper functions
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
        break;
      }
      default:
        ctx.rect(frame.x, frame.y, frame.width, frame.height);
    }
  };

  // Load template data
  useEffect(() => {
    const loadTemplate = async (retryCount = 0) => {
      if (!templateId) return;

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
        
        if (templateData.frames && Array.isArray(templateData.frames)) {
          setFrames(templateData.frames as FrameData[]);
          console.log('Frames loaded:', templateData.frames.length);
        } else {
          console.log('No frames found in template');
          setFrames([]);
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

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    console.log('Initializing canvas...');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    // Set canvas size - preserve original template dimensions
    const width = 1200;
    const height = 800;
    setCanvasSize({ width, height });
    canvas.width = width;
    canvas.height = height;

    console.log('Canvas initialized with dimensions:', { width, height });
  }, []);

  // Render canvas content to a given context (for export)
  const renderCanvasToContext = useCallback(async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      if (!backgroundUrl) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        return;
      }

    // Clear canvas
    ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

    // Load and draw background image
    const bgImage = await loadImage(backgroundUrl);
    drawBackgroundImage(ctx, bgImage, width, height);

    // Draw user data in frames
    for (const frame of frames) {
      const userInput = userData[frame.id];
      if (!userInput) continue;

      if (frame.type === 'image' && userInput.type === 'image') {
        // Draw user image
        const imageSrc = userInput.uploadedUrl || userInput.value;
        
        // Check if this is an edited image (data URL) or original file
        if (typeof imageSrc === 'string' && imageSrc.startsWith('data:')) {
          // This is an edited image that already includes frame rotation and user positioning
          const userImage = await loadImage(imageSrc);
          
          // Draw the edited image directly - it's already perfect from the editor
          // The edited image already includes frame rotation, so no need to apply it again
          ctx.drawImage(
            userImage,
            frame.x, frame.y, frame.width, frame.height
          );
        } else {
          // This is an original file that needs cropping
          const userImage = await loadImage(typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc as File));
          
          // Calculate aspect ratio and crop using utility function
          const cropData = cropImageToFrame(userImage, frame.width, frame.height);

          // Draw image upright first, then apply rotated clipping
          ctx.save();
          
          // Draw the image upright (no rotation)
          ctx.drawImage(
            userImage,
            cropData.sourceX, cropData.sourceY, cropData.sourceWidth, cropData.sourceHeight,
            frame.x, frame.y, cropData.drawWidth, cropData.drawHeight
          );
          
          // Now apply rotated clipping path
          ctx.globalCompositeOperation = 'destination-in';
          
          // Move to frame center for rotation
          const centerX = frame.x + frame.width / 2;
          const centerY = frame.y + frame.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((frame.rotation || 0) * Math.PI / 180);
          ctx.translate(-centerX, -centerY);
          
          // Create clipping path for shape (this will be rotated)
          createShapePath(ctx, frame);
          ctx.fill();
          
          ctx.restore();
        }

      } else if (frame.type === 'text' && userInput.type === 'text') {
        // Draw user text
        const text = userInput.value as string;
        if (!text) continue;

        const properties = frame.properties || {};
        const fontFamily = properties.fontFamily || 'Arial';
        const fontSize = properties.fontSize || 24;
        
        // Draw text upright first, then apply rotated clipping
        ctx.save();
        
        // Apply custom font if available
        applyFontToContext(ctx, fontFamily, fontSize);
        ctx.fillStyle = properties.color || '#000000';
        ctx.textAlign = (properties.textAlign as CanvasTextAlign) || 'center';

        // Calculate text position
        const textX = frame.x + frame.width / 2;
        const textY = frame.y + frame.height / 2 + (properties.fontSize || 24) / 3;

        // Draw text with word wrapping (upright)
        const words = text.split(' ');
        const lineHeight = (properties.fontSize || 24) * 1.2;
        let currentLine = '';
        let currentY = frame.y + lineHeight;

        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > frame.width && currentLine !== '') {
            ctx.fillText(currentLine, textX, currentY);
            currentLine = word + ' ';
            currentY += lineHeight;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          ctx.fillText(currentLine, textX, currentY);
        }
        
        // Now apply rotated clipping path
        ctx.globalCompositeOperation = 'destination-in';
        
        // Move to frame center for rotation
        const centerX = frame.x + frame.width / 2;
        const centerY = frame.y + frame.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((frame.rotation || 0) * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
        
        // Create clipping path for shape (this will be rotated)
        createShapePath(ctx, frame);
        ctx.fill();
        
        ctx.restore();
      }
    }
    } catch (error) {
      console.error('Error rendering canvas to context:', error);
    }
  }, [backgroundUrl, frames, userData, createShapePath, applyFontToContext]);

  // Render canvas with user data
  const renderCanvas = useCallback(async () => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !backgroundUrl) {
        return;
      }

      await renderCanvasToContext(ctx, canvas.width, canvas.height);
  } catch (error) {
    console.error('Error rendering canvas:', error);
  }
  }, [renderCanvasToContext, backgroundUrl]);

  // Initialize canvas on mount
  useEffect(() => {
    if (template && backgroundUrl) {
      initializeCanvas();
    }
  }, [template, backgroundUrl, initializeCanvas]);

  // Render canvas when data changes
  useEffect(() => {
    if (canvasRef.current && backgroundUrl && frames.length > 0) {
      renderCanvas();
    }
  }, [backgroundUrl, frames, userData, renderCanvas]);

  // Handle file upload - open image editor
  const handleFileUpload = async (frameId: string, file: File) => {
    try {
      const frame = frames.find(f => f.id === frameId);
      if (!frame) {
        toast.error('Frame not found');
        return;
      }

      setEditingFrame(frame);
      setEditingImageFile(file);
      setImageEditorOpen(true);
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Failed to open image editor');
    }
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
        transformData // Store transform data for potential re-editing
        }
      }));

    setImageEditorOpen(false);
    setEditingFrame(null);
    setEditingImageFile(null);
    toast.success('Image edited and applied successfully!');
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

  // Generate and download
  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setGenerating(true);
    try {
      // Upload any cached images first
      const updatedUserData = { ...userData };
      
      for (const [frameId, userInput] of Object.entries(userData)) {
        if (userInput.type === 'image' && userInput.value instanceof File && !userInput.uploadedUrl?.startsWith('http')) {
          try {
            const imageUrl = await uploadImage(userInput.value, 'user-uploads');
            updatedUserData[frameId] = {
              ...userInput,
              uploadedUrl: imageUrl
            };
          } catch (error) {
            console.error('Failed to upload image for frame:', frameId, error);
            toast.error('Failed to upload some images');
          }
        }
      }

      // Re-render canvas to ensure latest data
      await renderCanvas();

      const canvas = canvasRef.current;
      
      // Create a high-resolution export canvas
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('Failed to get export canvas context');
      
      // Set export canvas to high resolution (2x for better quality)
      const scale = 2;
      exportCanvas.width = canvas.width * scale;
      exportCanvas.height = canvas.height * scale;
      
      // Scale the context to match the export size
      exportCtx.scale(scale, scale);
      
      // Re-render the content to the export canvas
      await renderCanvasToContext(exportCtx, exportCanvas.width / scale, exportCanvas.height / scale);
      
      // Load background image for cropping
      const bgImage = await loadImage(backgroundUrl);
      
      // Create cropped canvas to remove white space
      const croppedCanvas = createCroppedCanvas(exportCanvas, bgImage);
      
      const dataURL = croppedCanvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.download = `${template?.name || 'flyer'}-personalized.png`;
      link.href = dataURL;
      link.click();

      toast.success('Flyer downloaded successfully!');
    } catch (error) {
      console.error('Error generating flyer:', error);
      toast.error('Failed to generate flyer');
    } finally {
      setGenerating(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;

    setGenerating(true);
    try {
      // Upload any cached images first
      const updatedUserData = { ...userData };
      
      for (const [frameId, userInput] of Object.entries(userData)) {
        if (userInput.type === 'image' && userInput.value instanceof File && !userInput.uploadedUrl?.startsWith('http')) {
          try {
            const imageUrl = await uploadImage(userInput.value, 'user-uploads');
            updatedUserData[frameId] = {
              ...userInput,
              uploadedUrl: imageUrl
            };
          } catch (error) {
            console.error('Failed to upload image for frame:', frameId, error);
            toast.error('Failed to upload some images');
          }
        }
      }

      // Re-render canvas to ensure latest data
      await renderCanvas();

      const canvas = canvasRef.current;
      const filename = `${template?.name || 'flyer'}-personalized.pdf`;
      
      await exportCanvasToPDF(canvas, {
        width: canvas.width,
        height: canvas.height,
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

  // Copy share link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  // Generate QR code
  const handleGenerateQR = () => {
    setShowFullPreview(true);
  };

  // Reset form
  const handleReset = () => {
    setUserData({});
    toast.success('Form reset successfully!');
  };

  // Refresh template
  const handleRefresh = () => {
    setLastRefresh(Date.now());
    toast.success('Template refreshed!');
  };

  // Save progress
  const handleSave = async () => {
    try {
      // Upload any cached images
      const updatedUserData = { ...userData };
      
      for (const [frameId, userInput] of Object.entries(userData)) {
        if (userInput.type === 'image' && userInput.value instanceof File && !userInput.uploadedUrl?.startsWith('http')) {
          try {
            const imageUrl = await uploadImage(userInput.value, 'user-uploads');
            updatedUserData[frameId] = {
              ...userInput,
              uploadedUrl: imageUrl
            };
          } catch (error) {
            console.error('Failed to upload image for frame:', frameId, error);
          }
        }
      }

      setUserData(updatedUserData);
      toast.success('Progress saved!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

  // Load available fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fonts = await getAvailableFonts();
        setAvailableFonts(fonts);
    } catch (error) {
        console.error('Error loading fonts:', error);
    }
  };
    loadFonts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading template...</h2>
          <p className="text-gray-500 mt-2">Please wait while we prepare your flyer</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Template Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">No template found</h2>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
                className="mr-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{template.name}</h1>
                {template.description && (
                  <p className="text-sm text-gray-500">{template.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
                onClick={handleRefresh}
            >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
                onClick={handleCopyLink}
            >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
            </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
            >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
                    onClick={handleGenerateQR}
            >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
            </Button>
                </div>
              </div>
              
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[600px] object-contain"
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxWidth: '100%',
                    display: 'block'
                  }}
                />
                
                {previewMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-75" />
                      <p className="text-lg font-medium">Preview Mode</p>
                      <p className="text-sm opacity-75">Click "Edit Mode" to make changes</p>
          </div>
        </div>
                )}
              </div>
            </Card>
              </div>

          {/* Form Area */}
              <div className="space-y-6">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Personalize Your Flyer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {frames.map((frame) => (
                  <div key={frame.id} className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                        {frame.type === 'image' ? 'Upload Image' : 'Enter Text'}
                      {frame.properties?.placeholder && (
                        <span className="text-gray-500 ml-2">({frame.properties.placeholder})</span>
                      )}
                    </Label>
                    
                      {frame.type === 'image' ? (
                        <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                handleFileUpload(frame.id, file);
                              }
                              };
                              input.click();
                            }}
                            disabled={previewMode}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Image
                          </Button>
                          {userData[frame.id]?.type === 'image' && (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                Image Added
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Re-edit existing image
                                  const existingData = userData[frame.id];
                                  if (existingData?.type === 'image') {
                                    // For re-editing, we need to convert data URL back to file
                                    if (typeof existingData.value === 'string' && existingData.value.startsWith('data:')) {
                                      // Convert data URL to file
                                      fetch(existingData.value)
                                        .then(res => res.blob())
                                        .then(blob => {
                                          const file = new File([blob], 'edited-image.png', { type: 'image/png' });
                                          setEditingFrame(frame);
                                          setEditingImageFile(file);
                                          setImageEditorOpen(true);
                                        })
                                        .catch(err => {
                                          console.error('Error converting data URL to file:', err);
                                          toast.error('Failed to open image for editing');
                                        });
                                    } else if (existingData.value instanceof File) {
                                      setEditingFrame(frame);
                                      setEditingImageFile(existingData.value);
                                      setImageEditorOpen(true);
                                    }
                                  }
                                }}
                                disabled={previewMode}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                        {userData[frame.id]?.type === 'image' && (
                          <div className="text-xs text-gray-500">
                            ✓ Image uploaded successfully
                            </div>
                          )}
                        </div>
                      ) : (
                          <Input
                        type="text"
                            placeholder={frame.properties?.placeholder || 'Enter your text here'}
                        value={userData[frame.id]?.type === 'text' ? (userData[frame.id].value as string) : ''}
                            onChange={(e) => handleTextInput(frame.id, e.target.value)}
                        disabled={previewMode}
                        className="w-full"
                      />
                      )}
              </div>
                ))}

              {frames.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No editable areas found in this template</p>
                </div>
              )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                <Button
                    onClick={handleSave}
                  variant="outline"
                    className="flex-1"
                    disabled={previewMode}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                </Button>
                <Button
                    onClick={handleReset}
                  variant="outline"
                    disabled={previewMode}
                >
                    Reset
                </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                <Button
                  onClick={handleDownload}
                    disabled={generating || previewMode}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                      </>
                    )}
                </Button>
                
                <Button
                  onClick={handleExportPDF}
                    variant="outline"
                    disabled={generating || previewMode}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                </Button>
              </div>
              </div>
            </Card>
                </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Full Preview</h3>
              <Button
                  variant="ghost"
                size="sm"
                onClick={() => setShowFullPreview(false)}
              >
                  ×
              </Button>
            </div>
            </div>
            <div className="p-6">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ 
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <ImageEditorModal
        open={imageEditorOpen}
        onClose={() => {
          setImageEditorOpen(false);
          setEditingFrame(null);
          setEditingImageFile(null);
        }}
        imageFile={editingImageFile}
        frame={editingFrame!}
        onApply={handleImageEditorComplete}
      />
    </div>
  );
} 