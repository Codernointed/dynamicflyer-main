import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import FlyerPreview from "@/components/FlyerPreview";
import ProgressIndicator from "@/components/ProgressIndicator";
import { validateImage } from "@/lib/validation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const Generator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, label: "Details", completed: currentStep > 1, current: currentStep === 1 },
    { id: 2, label: "Image", completed: currentStep > 2, current: currentStep === 2 },
    { id: 3, label: "Review", completed: false, current: currentStep === 3 },
  ];

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!imageFile) {
        toast.error("Please upload an image");
        return;
      }
      
      const validation = await validateImage(imageFile);
      if (!validation.valid) {
        setImageError(validation.error);
        toast.error(validation.error);
        return;
      }
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageSelect = async (file: File | null, preview: string | null) => {
    setImageFile(file);
    setImagePreview(preview);
    setImageError(null);
    
    if (file) {
      const validation = await validateImage(file);
      if (!validation.valid) {
        setImageError(validation.error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !imageFile) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      localStorage.setItem('flyerName', name);
      localStorage.setItem('flyerImage', imagePreview as string);
      
      toast.success("Flyer created successfully!");
      navigate("/success");
    } catch (error) {
      toast.error("Failed to create flyer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-container py-10">
        <h1 className="text-3xl font-bold text-center mb-8">Create Your Flyer</h1>
        
        <ProgressIndicator steps={steps} />
        
        <div className="grid md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-4">Enter Your Details</h2>
                  <p className="text-muted-foreground mb-6">
                    Let's start with some basic information for your flyer.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upload Your Image</h2>
                  <p className="text-muted-foreground mb-6">
                    Choose a high-quality image (minimum 800x980 pixels) for your flyer.
                  </p>
                </div>
                
                <ImageUpload 
                  onImageSelect={handleImageSelect}
                  error={imageError}
                />
              </motion.div>
            )}
            
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-4">Review & Generate</h2>
                  <p className="text-muted-foreground mb-6">
                    Please review your flyer details before generating.
                  </p>
                </div>
                
                <div className="space-y-4 bg-secondary/50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <p className="font-medium">{name}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Image:</span>
                    {imagePreview ? (
                      <div className="mt-2 aspect-video rounded-md overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Selected"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <p>No image selected</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-md text-sm ${
                  currentStep === 1
                    ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                } transition-colors`}
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Processing...
                  </>
                ) : currentStep === 3 ? (
                  <>Generate Flyer</>
                ) : (
                  <>
                    Continue 
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-xl font-semibold mb-6">Preview</h2>
            <div className="max-w-[300px] w-full">
              <FlyerPreview 
                userName={name}
                imageUrl={imagePreview}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Generator;
