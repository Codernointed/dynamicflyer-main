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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getTemplate } from '@/lib/supabase';
import { Template } from '@/integrations/supabase/types';
import { uploadImage } from '@/lib/supabase';

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

interface UserData {
  [frameId: string]: {
    type: 'image' | 'text';
    value: string | File;
  };
}

export default function PublicGenerator() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  // Template state
  const [template, setTemplate] = useState<Template | null>(null);
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

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load template data
  useEffect(() => {
    if (!templateId) {
      setError('Template ID is required');
      setLoading(false);
      return;
    }

    const loadTemplate = async () => {
      try {
        setLoading(true);
        const templateData = await getTemplate(templateId);
        
        if (!templateData) {
          setError('Template not found');
          return;
        }

        setTemplate(templateData);
        setBackgroundUrl(templateData.background_url || '');
        
        if (templateData.frames && Array.isArray(templateData.frames)) {
          setFrames(templateData.frames as FrameData[]);
        }

        // Generate share link
        const link = `${window.location.origin}/flyer/${templateId}`;
        setShareLink(link);

      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 800;
    const height = 600;
    setCanvasSize({ width, height });
    canvas.width = width;
    canvas.height = height;

    renderCanvas();
  }, []);

  // Initialize canvas on mount
  useEffect(() => {
    if (template && backgroundUrl) {
      initializeCanvas();
    }
  }, [template, backgroundUrl, initializeCanvas]);

  // Render canvas with user data
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !backgroundUrl) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw background image
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      bgImage.onload = () => {
        // Scale image to fit canvas
        const scaleX = canvas.width / bgImage.width;
        const scaleY = canvas.height / bgImage.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = bgImage.width * scale;
        const scaledHeight = bgImage.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        ctx.drawImage(bgImage, x, y, scaledWidth, scaledHeight);
        resolve();
      };
      bgImage.onerror = reject;
      bgImage.src = backgroundUrl;
    });

    // Draw user data in frames
    for (const frame of frames) {
      const userInput = userData[frame.id];
      if (!userInput) continue;

      if (frame.type === 'image' && userInput.type === 'image') {
        // Draw user image
        const userImage = new Image();
        userImage.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          userImage.onload = () => {
            // Calculate aspect ratio and crop
            const frameAspect = frame.width / frame.height;
            const imageAspect = userImage.width / userImage.height;
            
            let drawWidth = frame.width;
            let drawHeight = frame.height;
            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = userImage.width;
            let sourceHeight = userImage.height;

            if (imageAspect > frameAspect) {
              // Image is wider, crop sides
              sourceWidth = userImage.height * frameAspect;
              sourceX = (userImage.width - sourceWidth) / 2;
            } else {
              // Image is taller, crop top/bottom
              sourceHeight = userImage.width / frameAspect;
              sourceY = (userImage.height - sourceHeight) / 2;
            }

            ctx.drawImage(
              userImage,
              sourceX, sourceY, sourceWidth, sourceHeight,
              frame.x, frame.y, drawWidth, drawHeight
            );
            resolve();
          };
          userImage.onerror = reject;
          userImage.src = userInput.value as string;
        });

      } else if (frame.type === 'text' && userInput.type === 'text') {
        // Draw user text
        const text = userInput.value as string;
        if (!text) continue;

        const properties = frame.properties || {};
        ctx.font = `${properties.fontSize || 24}px ${properties.fontFamily || 'Arial'}`;
        ctx.fillStyle = properties.color || '#000000';
        ctx.textAlign = (properties.textAlign as CanvasTextAlign) || 'center';

        // Calculate text position
        const textX = frame.x + frame.width / 2;
        const textY = frame.y + frame.height / 2 + (properties.fontSize || 24) / 3;

        // Draw text with word wrapping
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
      }
    }
  }, [backgroundUrl, frames, userData]);

  // Re-render when user data changes
  useEffect(() => {
    if (template && backgroundUrl) {
      renderCanvas();
    }
  }, [userData, renderCanvas, template, backgroundUrl]);

  // Handle file upload
  const handleFileUpload = async (frameId: string, file: File) => {
    try {
      const imageUrl = await uploadImage(file, 'user-uploads');
      
      setUserData(prev => ({
        ...prev,
        [frameId]: {
          type: 'image',
          value: imageUrl
        }
      }));

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
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
      // Re-render canvas to ensure latest data
      await renderCanvas();

      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png', 1.0);
      
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

  // Copy share link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Share link copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Generate QR code
  const handleGenerateQR = () => {
    // For now, just show a placeholder
    toast.info('QR code generation coming soon!');
  };

  // Reset form
  const handleReset = () => {
    setUserData({});
    toast.success('Form reset successfully!');
  };

  // Save personalized template
  const handleSave = async () => {
    if (!template?.id) return;

    setGenerating(true);
    try {
      // Re-render canvas to ensure latest data
      await renderCanvas();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL('image/png', 1.0);
      
      // Create a personalized template record
      const personalizedData = {
        original_template_id: template.id,
        user_data: userData,
        generated_image_url: dataURL,
        created_at: new Date().toISOString()
      };

      // For now, just show success message
      // In a full implementation, you'd save this to the database
      toast.success('Personalized template saved!');
      
      // You could also trigger a download here
      const link = document.createElement('a');
      link.download = `${template.name}-personalized.png`;
      link.href = dataURL;
      link.click();

    } catch (error) {
      console.error('Error saving personalized template:', error);
      toast.error('Failed to save template');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {template?.name || 'Personalize Template'}
              </h1>
              {template?.template_type && (
                <Badge variant="secondary">{template.template_type}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Full Preview
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={generating}
            >
              <Save className="mr-2 h-4 w-4" />
              {generating ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={generating}
            >
              <Download className="mr-2 h-4 w-4" />
              {generating ? 'Generating...' : 'Download'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - User Inputs */}
        {!previewMode && (
          <div className="w-80 border-r bg-white overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Personalize Your Template</h2>
                <p className="text-sm text-gray-600">
                  Fill in your information to create a personalized version
                </p>
              </div>

              <div className="space-y-6">
                {frames.map((frame) => (
                  <Card key={frame.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {frame.type === 'image' ? (
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Type className="h-4 w-4 text-orange-600" />
                        )}
                        {frame.type === 'image' ? 'Upload Image' : 'Enter Text'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {frame.type === 'image' ? (
                        <div className="space-y-2">
                          <Label htmlFor={`file-${frame.id}`}>Choose Image</Label>
                          <Input
                            id={`file-${frame.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(frame.id, file);
                              }
                            }}
                          />
                          {userData[frame.id]?.type === 'image' && (
                            <div className="mt-2">
                              <img
                                src={userData[frame.id].value as string}
                                alt="Uploaded"
                                className="w-full h-24 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor={`text-${frame.id}`}>
                            {frame.properties?.placeholder || 'Enter text'}
                          </Label>
                          <Input
                            id={`text-${frame.id}`}
                            placeholder={frame.properties?.placeholder || 'Enter your text here'}
                            value={(userData[frame.id]?.value as string) || ''}
                            onChange={(e) => handleTextInput(frame.id, e.target.value)}
                          />
                          <div className="text-xs text-gray-500">
                            Font: {frame.properties?.fontFamily || 'Arial'} • 
                            Size: {frame.properties?.fontSize || 24}px • 
                            Color: {frame.properties?.color || '#000000'}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {frames.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Personalization Areas</h3>
                  <p className="text-sm text-gray-500">
                    This template doesn't have any areas for personalization yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 p-6 bg-gray-100 min-h-0">
          <div className="h-full flex flex-col">
            {/* Canvas Controls */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {canvasSize.width} × {canvasSize.height}
                </span>
                {previewMode && (
                  <Badge variant="secondary">Preview Mode</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQR}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={generating}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {generating ? 'Generating...' : 'Download'}
                </Button>
              </div>
            </div>

            {/* Canvas Container */}
            <Card className="flex-1 p-4 bg-gray-50 overflow-hidden">
              <div className="relative h-full">
                <div className="flex justify-center items-center h-full">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-gray-300 rounded-lg shadow-lg bg-white max-w-full max-h-full"
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{ 
                      width: canvasSize.width, 
                      height: canvasSize.height,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      display: 'block',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                
                {frames.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-gray-500 max-w-md bg-white/90 backdrop-blur-sm rounded-lg p-6 border">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Personalization Areas</h3>
                      <p className="text-sm text-gray-500">
                        This template doesn't have any areas for personalization yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Help Text */}
            <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
              <p>Fill in your information on the left to personalize your template</p>
              <p>Click Download to save your personalized version</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Full Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullPreview(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border rounded-lg shadow-lg"
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ 
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={handleDownload} disabled={generating}>
                <Download className="mr-2 h-4 w-4" />
                {generating ? 'Generating...' : 'Download'}
              </Button>
              <Button variant="outline" onClick={() => setShowFullPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 