import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import fabric from "fabric";
import { Canvas, Image, Rect, Text, util as fabricUtil, Control } from "fabric";
import { validateImage } from "@/lib/validation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Download, Image as ImageIcon, Type, ZoomIn, ZoomOut } from "lucide-react";
import CropModal from "@/components/CropModal";
import ImageUpload from "@/components/ImageUpload";
import ProgressIndicator from "@/components/ProgressIndicator";
import CanvasControls from "@/components/CanvasControls";
import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.25);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [activeUserImage, setActiveUserImage] = useState<Image | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [initialZoomSet, setInitialZoomSet] = useState(false);

  const steps = [
    { id: 1, label: "Details", completed: currentStep > 1, current: currentStep === 1 },
    { id: 2, label: "Image", completed: currentStep > 2, current: currentStep === 2 },
    { id: 3, label: "Customize", completed: currentStep > 3, current: currentStep === 3 },
    { id: 4, label: "Download", completed: false, current: currentStep === 4 },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    if (canvas) {
      canvas.dispose();
    }

    let timerId: number;

    const initCanvas = async () => {
      setLoading(true);
      
      try {
        const fabricCanvas = new Canvas(canvasRef.current, {
          width: 1080,
          height: 1080,
          backgroundColor: '#000',
          selection: false,
        });
        
        const templateImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = '/Repping.png';
        });

        const fabricImage = new Image(templateImg);
        fabricImage.scaleToWidth(fabricCanvas.width || 1080);
        fabricImage.set({
          selectable: false,
          evented: false,
        });
        
        fabricCanvas.add(fabricImage);
        
        const minZoom = isMobile ? 0.25 : 0.46;
        setZoom(minZoom);
        fabricCanvas.setZoom(minZoom);
        
        fabricCanvas.renderAll();
        
        setCanvas(fabricCanvas);
        setInitialZoomSet(true);
      } catch (err) {
        toast.error("Failed to load template");
        console.error("Canvas initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    timerId = window.setTimeout(() => {
      initCanvas();
    }, 300);

    return () => {
      clearTimeout(timerId);
      if (canvas) {
        canvas.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom, canvas]);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (canvas && isMobile) {
        handleFitToView();
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [canvas, isMobile]);

  useEffect(() => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const existingText = objects.find(obj => {
      return obj instanceof Text && obj.get('nameText') === true;
    });
    
    if (existingText) {
      canvas.remove(existingText);
    }
    
    if (name) {
      const text = new Text(`${name}`, {
        left: 819,
        top: 905,
        textAlign: 'center',
        originX: 'center',
        fill: '#d4941c',
        fontFamily: 'Arial',
        fontSize: 39,
        fontWeight: 'bold',
      });
      
      text.set('nameText', true);
      
      canvas.add(text);
      canvas.renderAll();
    }
  }, [name, canvas]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleImageUpload = async (file: File | null, preview: string | null) => {
    if (!file || !preview) return;
    
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    setImageFile(file);
    setCroppedImageUrl(null);
    setActiveUserImage(null);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!canvas) return;
    
    setCroppedImageUrl(croppedImageUrl);
    
    const img = new window.Image();
    img.onload = () => {
      try {
        const objects = canvas.getObjects();
        const existingImage = objects.find(obj => 
          obj instanceof Image && obj.get('userImage') === true
        );
        
        if (existingImage) {
          canvas.remove(existingImage);
        }

        const targetWidth = 365;
        const targetHeight = 500;
        const targetLeft = 813;
        const targetTop = 573;
        
        const clipRect = new Rect({
          left: targetLeft,
          top: targetTop,
          width: targetWidth,
          height: targetHeight,
          originX: 'center',
          originY: 'center',
          rx: 50,
          ry: 50,
          absolutePositioned: true,
        });
        
        const fabricImage = new Image(img);
        fabricImage.set({
          left: targetLeft,
          top: targetTop,
          originX: 'center',
          originY: 'center',
          userImage: true,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          cornerStyle: 'circle',
          cornerColor: '#d4941c',
          cornerStrokeColor: '#000',
          transparentCorners: false,
          cornerSize: 12,
          minScaleLimit: 0.1
        });

        const scaleX = targetWidth / img.width;
        const scaleY = targetHeight / img.height;
        const scale = Math.min(scaleX, scaleY) * 0.95;
        fabricImage.scale(scale);
        
        fabricImage.clipPath = clipRect;
        
        canvas.add(fabricImage);
        canvas.setActiveObject(fabricImage);
        setActiveUserImage(fabricImage);
        canvas.renderAll();
        
        toast.success("Image added! Adjust position and size as needed.");
      } catch (err) {
        toast.error("Failed to add image");
        console.error(err);
      }
    };
    
    img.src = croppedImageUrl;
  };

  const renderIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) => {
    const size = 8;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabricUtil.degreesToRadians(fabricObject.angle));
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4941c';
    ctx.fill();
    ctx.restore();
  };

  const initialZoom = isMobile ? 0.25 : 0.46;

  const handleZoomChange = (value: number | number[]) => {
    const newZoom = Array.isArray(value) ? value[0] : value;
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    const minZoom = isMobile ? 0.25 : 0.46;
    setZoom(minZoom);
  };

  const handleFitToView = useCallback(() => {
    if (!canvas || !canvasRef.current) return;
    
    const containerWidth = canvasRef.current.parentElement?.clientWidth || 500;
    const containerHeight = canvasRef.current.parentElement?.clientHeight || 500;
    
    const widthRatio = containerWidth / 1080;
    const heightRatio = containerHeight / 1080;
    const fitZoom = Math.min(widthRatio, heightRatio) * 0.95;
    
    const minAllowedZoom = isMobile ? 0.25 : 0.46;
    const newZoom = Math.max(minAllowedZoom, fitZoom);
    
    setZoom(newZoom);
  }, [canvas, isMobile]);

  useEffect(() => {
    if (initialZoomSet && canvas) {
      handleFitToView();
    }
  }, [isMobile, canvas, initialZoomSet, handleFitToView]);

  const handleStepChange = (step: number) => {
    if (step > currentStep) {
      if (step === 2 && !name) {
        toast.error("Please enter your name first");
        return;
      }
      
      if (step === 3 && !imageFile) {
        toast.error("Please upload an image first");
        return;
      }
    }
    
    setCurrentStep(step);
  };

  const handleDownload = () => {
    if (!canvas) return;
    
    if (!name || !imageFile) {
      toast.error("Please add your name and image before downloading");
      return;
    }
    
    setGenerating(true);
    
    try {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      const link = document.createElement('a');
      link.download = `flyer-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Flyer downloaded successfully!");
      
      localStorage.setItem('flyerName', name);
      localStorage.setItem('flyerImage', dataURL);
      navigate('/success');
    } catch (err) {
      toast.error("Failed to download flyer");
      console.error("Download error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Enter Your Name
                </span>
              </h2>
              <p className="text-muted-foreground mb-6">
                This will appear on your customized flyer.
              </p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 flex items-center">
                <Type className="w-4 h-4 mr-2" />
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will appear as "{name} I am repping live, join me!"
              </p>
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleStepChange(2)}
                disabled={!name}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Upload Your Photo
                </span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose a high-quality image for your flyer.
              </p>
            </div>
            
            <ImageUpload 
              onImageSelect={handleImageUpload} 
              error={null} 
            />
            
            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleStepChange(1)}
              >
                Back
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleStepChange(3)}
                disabled={!imageFile}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold mb-4">Customize Your Flyer</h2>
              <p className="text-muted-foreground mb-6">
                Drag, resize and position your image as desired.
              </p>
            </div>
            
            {activeUserImage && (
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-sm font-medium mb-2">
                    <span>Image Size</span>
                    <div className="flex items-center space-x-2">
                      <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
                      <Slider
                        defaultValue={[1]}
                        max={2}
                        min={0.46}
                        step={0.05}
                        onValueChange={(values) => handleZoomChange(values)}
                        className="w-[120px]"
                      />
                      <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </label>
                </div>
                
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    • Drag to reposition your image inside the frame<br />
                    • Use corner handles to resize<br />
                    • Click outside to deselect
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleStepChange(2)}
              >
                Back
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleStepChange(4)}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold mb-4">Download Your Flyer</h2>
              <p className="text-muted-foreground mb-6">
                Your personalized flyer is ready to download.
              </p>
            </div>
            
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleDownload}
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-background/20 border-t-background animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Flyer
                </>
              )}
            </Button>
            
            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleStepChange(3)}
                disabled={generating}
              >
                Back
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={generating}
              >
                Create New
              </Button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="page-container py-4 sm:py-8">
        <ProgressIndicator steps={steps} />
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 mt-4 sm:mt-8 items-start">
          <div className="flex-1 flex flex-col items-center">
            <div className="relative shadow-lg mb-2 mx-auto" style={{ maxWidth: "500px", width: "100%" }}>
              <AspectRatio ratio={1 / 1} className="border border-border rounded-lg overflow-hidden">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  </div>
                )}
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain"
                />
              </AspectRatio>
            </div>
            
            {/* Zoom out message */}
            {canvas && zoom > 0.46 && (
              <div className="text-center mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm text-muted-foreground text-xs rounded-full border border-border/50">
                  <ZoomOut className="h-3 w-3" />
                  Zoom out to see the whole flyer
                </span>
              </div>
            )}
            
            {/* Canvas controls */}
            {canvas && (
              <div className="mb-4 flex justify-center">
                <CanvasControls
                  zoom={zoom}
                  onZoomChange={handleZoomChange}
                  onReset={handleResetZoom}
                  minZoom={isMobile ? 0.25 : 0.46}
                  maxZoom={isMobile ? 1.2 : 1.5}
                  onFitToView={handleFitToView}
                />
              </div>
            )}
          </div>
          
          <Card className="flex-1 p-4 sm:p-6 lg:max-w-md w-full sticky top-4">
            {renderStepContent()}
          </Card>
        </div>
      </div>
      
      <CropModal
        open={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageFile={imageFile}
        onCropComplete={handleCropComplete}
      />
    </Layout>
  );
};

export default Editor;
