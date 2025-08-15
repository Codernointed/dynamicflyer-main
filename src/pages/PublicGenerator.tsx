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
  BarChart3
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
    originalFile?: File; // Store original file for re-editing
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
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [creatorName, setCreatorName] = useState<string>('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

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
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, subscription_tier')
            .eq('id', templateData.user_id)
            .single();
            
          if (userData && !userError) {
            setCreatorName(userData.full_name || 'Anonymous Creator');
            setSubscriptionTier(userData.subscription_tier || 'free');
          }
        } catch (userError) {
          console.warn('Failed to fetch creator info:', userError);
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
      console.log('renderCanvasToContext called with backgroundUrl:', backgroundUrl);
      
      if (!backgroundUrl) {
        console.log('No background URL, filling with white');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        return;
      }

    // Clear canvas
    ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

    // Load and draw background image
    console.log('Loading background image from:', backgroundUrl);
    try {
      const bgImage = await loadImage(backgroundUrl);
      console.log('Background image loaded successfully:', bgImage);
      drawBackgroundImage(ctx, bgImage, width, height);
      console.log('Background image drawn to canvas');
    } catch (error) {
      console.error('Failed to load background image:', error);
      // Fallback to white background if image loading fails
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw user data in frames
    console.log('Starting to draw user data in frames, frames count:', frames.length);
    for (const frame of frames) {
      const userInput = userData[frame.id];
      console.log('Processing frame:', frame.id, 'userInput:', userInput);
      if (!userInput) {
        console.log('No user input for frame:', frame.id);
        continue;
      }

      if (frame.type === 'image' && userInput.type === 'image') {
        // Draw user image
        const imageSrc = userInput.uploadedUrl || userInput.value;
        
        // Check if this is an edited image (data URL) or original file
        if (typeof imageSrc === 'string' && imageSrc.startsWith('data:')) {
          console.log('Drawing edited image for frame:', frame.id);
          // This is an edited image that includes user transformations but NOT frame rotation
          const userImage = await loadImage(imageSrc);
          console.log('Edited user image loaded:', userImage);
          
          // Draw the edited image with frame rotation applied
          ctx.save();
          
          // Move to frame center for rotation
          const centerX = frame.x + frame.width / 2;
          const centerY = frame.y + frame.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((frame.rotation || 0) * Math.PI / 180);
          ctx.translate(-centerX, -centerY);
          
          // Create clipping path for shape first
          createShapePath(ctx, frame);
          ctx.clip();
          
          // Draw the edited image (it already has user transformations applied)
          ctx.drawImage(
            userImage,
            frame.x, frame.y, frame.width, frame.height
          );
          console.log('Edited image drawn to canvas with clipping');
          
          ctx.restore();
            } else {
          // This is an original file that needs cropping
          const userImage = await loadImage(typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc as File));
          
          // Calculate aspect ratio and crop using utility function
          const cropData = cropImageToFrame(userImage, frame.width, frame.height);

          // Draw image with frame rotation applied
          ctx.save();
          
          // Move to frame center for rotation
          const centerX = frame.x + frame.width / 2;
          const centerY = frame.y + frame.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((frame.rotation || 0) * Math.PI / 180);
          ctx.translate(-centerX, -centerY);
          
          // Create clipping path for shape first
          createShapePath(ctx, frame);
          ctx.clip();
          
          // Draw the image rotated with the frame
          ctx.drawImage(
            userImage,
            cropData.sourceX, cropData.sourceY, cropData.sourceWidth, cropData.sourceHeight,
            frame.x, frame.y, cropData.drawWidth, cropData.drawHeight
          );
          
          ctx.restore();
        }

      } else if (frame.type === 'text' && userInput.type === 'text') {
        // Draw user text
        const text = userInput.value as string;
        if (!text) continue;

        const properties = frame.properties || {};
        const fontFamily = properties.fontFamily || 'Arial';
        const fontSize = properties.fontSize || 24;
        
        // Draw text with frame rotation applied
        ctx.save();
        
        // Move to frame center for rotation
        const centerX = frame.x + frame.width / 2;
        const centerY = frame.y + frame.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((frame.rotation || 0) * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
        
        // Create clipping path for shape first
        createShapePath(ctx, frame);
        ctx.clip();
        
        // Apply custom font if available
        applyFontToContext(ctx, fontFamily, fontSize);
        ctx.fillStyle = properties.color || '#000000';
        ctx.textAlign = (properties.textAlign as CanvasTextAlign) || 'center';

        // Calculate text position
        const textX = frame.x + frame.width / 2;
        const textY = frame.y + frame.height / 2 + (properties.fontSize || 24) / 3;

        // Draw text with word wrapping (rotated with frame)
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
        
        ctx.restore();
      }
    }
    console.log('Canvas rendering completed successfully');
    } catch (error) {
      console.error('Error rendering canvas to context:', error);
    }
  }, [backgroundUrl, frames, userData, createShapePath, applyFontToContext]);

  // Render canvas with user data
  const renderCanvas = useCallback(async () => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        console.log('Canvas or context not available');
        return;
      }
      
      if (!backgroundUrl) {
        console.log('Background URL not available, using white background');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      console.log('Rendering canvas with background:', backgroundUrl);
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

  // Monitor background URL changes
  useEffect(() => {
    console.log('Background URL changed:', backgroundUrl);
  }, [backgroundUrl]);

  // Render canvas when data changes
  useEffect(() => {
    console.log('Render canvas effect triggered:', { 
      hasCanvas: !!canvasRef.current, 
      backgroundUrl, 
      framesLength: frames.length 
    });
    
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

    console.log('Image editor completed, background URL:', backgroundUrl);
    console.log('Editing frame:', editingFrame);

      setUserData(prev => ({
        ...prev,
      [editingFrame.id]: {
          type: 'image',
        value: editedImageUrl,
        uploadedUrl: editedImageUrl,
        transformData, // Store transform data for potential re-editing
        originalFile: editingImageFile // Store original file for re-editing
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
      
      // Apply watermark if free tier
      const finalCanvas = shouldApplyWatermark(subscriptionTier) ? 
        addWatermarkToCanvas(croppedCanvas, 'free', creatorName) : croppedCanvas;
      
      const dataURL = finalCanvas.toDataURL('image/png', 1.0);
      
      // Track download for analytics
      if (template?.id) {
        try {
          await trackTemplateGeneration(template.id);
          setDownloadCount(prev => prev + 1);
        } catch (error) {
          console.error('Failed to track download:', error);
        }
      }
      
      const link = document.createElement('a');
      link.download = `${template?.name || 'design'}-personalized.png`;
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
      const filename = `${template?.name || 'design'}-personalized.pdf`;
      
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
        {/* Luxury background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border border-amber-300 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-amber-300 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-20 border border-amber-300 rounded-full"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-amber-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Your Design</h2>
          <p className="text-gray-600">Preparing your personalized masterpiece...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
        {/* Luxury background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border border-red-300 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-red-300 rounded-full"></div>
        </div>
        
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Template Not Found</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg px-8 py-3 rounded-lg font-semibold"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
        {/* Luxury background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border border-amber-300 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-amber-300 rounded-full"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Template Found</h2>
          <p className="text-gray-600 mb-8">The requested design template could not be located.</p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg px-8 py-3 rounded-lg font-semibold"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Luxury background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-40 h-40 border border-amber-300 rounded-full"></div>
        <div className="absolute top-60 right-20 w-32 h-32 border border-amber-300 rounded-full"></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 border border-amber-300 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 border border-amber-300 rounded-full"></div>
      </div>
      
        {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-amber-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-20 gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
                className="self-start sm:self-auto mr-0 sm:mr-6 text-amber-700 hover:text-amber-800 hover:bg-amber-50/80 rounded-lg px-3 sm:px-4 py-2 font-medium text-sm"
            >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
              {/* Infinity Generation Logo */}
              <div className="flex items-center mr-0 sm:mr-8">
                <img 
                  src="/asset1.png" 
                  alt="Infinity Generation" 
                  className="h-8 w-auto sm:h-12 mr-2 sm:mr-3"
                />
                <div className="border-l border-amber-200 pl-3 sm:pl-6">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Infinity Generation</span>
                    <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                    <span className="text-xs text-gray-500 hidden sm:inline">Design Studio</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">{template.name}</h1>
                  {template.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                  )}
                  {/* {creatorName && (
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-600">Created by</span>
                      <span className="text-xs font-medium text-amber-700 ml-1">{creatorName}</span>
                    </div>
                  )} */}
                </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center mr-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 mr-1" />
              <span className="text-xs font-medium text-amber-700">{downloadCount} downloads</span>
            </div>
            <Button
              variant="outline"
              size="sm"
                onClick={handleRefresh}
              className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm text-xs px-2 sm:px-3"
            >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
                onClick={handleCopyLink}
              className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm text-xs px-2 sm:px-3"
            >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Copy Link</span>
                  </>
                )}
            </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-8 border-amber-100 shadow-xl bg-white/95 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-4 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Design Preview</h2>
                  <p className="text-sm text-gray-600">See your personalized masterpiece come to life</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
              className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
            >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{previewMode ? 'Edit Mode' : 'Preview Mode'}</span>
                    <span className="sm:hidden">{previewMode ? 'Edit' : 'Preview'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
                    onClick={handleGenerateQR}
              className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
            >
                    <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">QR Code</span>
                    <span className="sm:hidden">QR</span>
            </Button>
                </div>
              </div>
              
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden border-2 border-amber-200 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 to-transparent pointer-events-none"></div>
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-contain relative z-10"
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxWidth: '100%',
                    display: 'block'
                  }}
                />
                
                {previewMode && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center text-white p-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-sm">
                        <Eye className="h-6 w-6 sm:h-8 sm:w-8 opacity-90" />
          </div>
                      <p className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Preview Mode</p>
                      <p className="text-xs sm:text-sm opacity-90">Click "Edit Mode" to make changes</p>
        </div>
        </div>
                )}
              </div>
            </Card>
              </div>

          {/* Form Area */}
              <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-8 border-amber-100 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <img 
                        src="/asset1.png" 
                        alt="Infinity Generation" 
                        className="h-4 w-auto sm:h-6"
                      />
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Personalize</span>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Your Design</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Add your personal touch to create something unique</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8">
                {frames.map((frame, index) => (
                  <div key={frame.id} className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 rounded-lg sm:rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <Label className="text-xs sm:text-sm font-semibold text-gray-800">
                        {frame.type === 'image' ? 'Upload Image' : 'Enter Text'}
                        {frame.properties?.placeholder && (
                          <span className="text-gray-500 ml-1 sm:ml-2 font-normal text-xs">({frame.properties.placeholder})</span>
                        )}
                      </Label>
              </div>

                        {frame.type === 'image' ? (
                        <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                            className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Choose Image</span>
                            <span className="sm:hidden">Choose</span>
                          </Button>
                          {userData[frame.id]?.type === 'image' && (
                            <>
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 font-medium shadow-sm">
                                ✓ Image Added
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Re-edit existing image
                                  const existingData = userData[frame.id];
                                  if (existingData?.type === 'image') {
                                    // Use original file if available, otherwise fallback to data URL
                                    if (existingData.originalFile) {
                                      setEditingFrame(frame);
                                      setEditingImageFile(existingData.originalFile);
                                      setImageEditorOpen(true);
                                    } else if (typeof existingData.value === 'string' && existingData.value.startsWith('data:')) {
                                      // Fallback: Convert data URL to file (for backward compatibility)
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
                                className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                        {userData[frame.id]?.type === 'image' && (
                          <div className="text-xs sm:text-sm text-amber-600 font-medium flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            Image uploaded successfully
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
                        className="w-full border-amber-200 focus:border-amber-400 focus:ring-amber-400 shadow-sm text-sm"
                      />
                      )}
              </div>
                ))}

              {frames.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Type className="h-8 w-8 text-amber-600" />
                  </div>
                    <p className="text-lg font-medium mb-2">No Editable Areas</p>
                    <p className="text-sm">This template doesn't have any customizable elements</p>
                </div>
              )}
              </CardContent>
              
              {creatorName && (
                    <div className="flex items-center justify-center mt-1">
                      <span className="text-xs text-gray-600">Created by</span>
                      <span className="text-xs font-medium text-amber-700 ml-1">{creatorName}</span>
                    </div>
                  )}
            </Card>

            {/* Action Buttons */}
            <Card className="p-4 sm:p-8 border-amber-100 shadow-xl bg-white/95 backdrop-blur-sm">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                    onClick={handleSave}
                  variant="outline"
                    className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
                    disabled={previewMode}
                  >
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Save Progress</span>
                    <span className="sm:hidden">Save</span>
                </Button>
                <Button
                    onClick={handleReset}
                  variant="outline"
                    disabled={previewMode}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-sm font-medium text-xs sm:text-sm px-2 sm:px-3"
                >
                    Reset
                </Button>
                </div>
                
                <Separator className="bg-gradient-to-r from-transparent via-amber-200 to-transparent h-px" />
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">Get your personalized design in high quality</p>
                  </div>
                
                <Button
                  onClick={handleDownload}
                    disabled={generating || previewMode}
                    className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 font-medium py-3 sm:py-4 text-sm sm:text-base"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2 sm:mr-3"></div>
                        <span className="hidden sm:inline">Creating Your Design...</span>
                        <span className="sm:hidden">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        <span className="hidden sm:inline">Download High-Quality PNG</span>
                        <span className="sm:hidden">Download PNG</span>
                      </>
                    )}
                </Button>
                
                <Button
                  onClick={handleExportPDF}
                    variant="outline"
                    disabled={generating || previewMode}
                    className="w-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50/80 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 font-semibold py-3 sm:py-4 text-sm sm:text-base"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-amber-600 border-t-transparent mr-2 sm:mr-3"></div>
                        <span className="hidden sm:inline">Generating PDF...</span>
                        <span className="sm:hidden">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        <span className="hidden sm:inline">Export as PDF</span>
                        <span className="sm:hidden">Export PDF</span>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl max-w-4xl sm:max-w-5xl w-full max-h-[90vh] sm:max-h-[95vh] overflow-hidden border border-amber-200 shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50/50 to-yellow-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-lg flex items-center justify-center shadow-sm">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Full Design Preview</h3>
                    <p className="text-xs sm:text-sm text-gray-600">View your personalized masterpiece</p>
                  </div>
                </div>
              <Button
                    variant="ghost"
                size="sm"
                onClick={() => setShowFullPreview(false)}
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-50/80 rounded-lg p-1 sm:p-2"
              >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
              </Button>
            </div>
            </div>
            <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-4">
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
        previousTransformData={editingFrame ? userData[editingFrame.id]?.transformData : undefined}
      />
    </div>
  );
} 