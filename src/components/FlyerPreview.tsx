
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface FlyerPreviewProps {
  imageUrl: string | null;
  userName: string;
}

const FlyerPreview: React.FC<FlyerPreviewProps> = ({ imageUrl, userName }) => {
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = 1080;
    canvas.height = 1080;
    
    const loadTemplate = async () => {
      setLoading(true);
      try {
        // Draw the background template image
        const templateImg = new Image();
        templateImg.crossOrigin = "Anonymous";
        
        templateImg.onload = () => {
          // Draw template
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          // Draw user image if available
          if (imageUrl) {
            const userImg = new Image();
            userImg.crossOrigin = "Anonymous";
            
            userImg.onload = () => {
              // Draw user image in the circular area
              const centerX = 823;
              const centerY = 583;
              const radius = 300 / 2;
              
              // Create circular clipping path
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.clip();
              
              // Calculate scaling to fill circle
              const scale = Math.max(
                (radius * 2) / userImg.width, 
                (radius * 2) / userImg.height
              );
              
              const scaledWidth = userImg.width * scale;
              const scaledHeight = userImg.height * scale;
              
              // Center image in circle
              const x = centerX - scaledWidth / 2;
              const y = centerY - scaledHeight / 2;
              
              // Draw the image
              ctx.drawImage(userImg, x, y, scaledWidth, scaledHeight);
              ctx.restore();
            };
            
            userImg.src = imageUrl;
          }
          
          // Add the name text
          if (userName) {
            // Load a custom font for title
            const headImg = new Image();
            headImg.crossOrigin = "Anonymous";
            
            headImg.onload = () => {
              // Draw the head image at the top
              const headWidth = 200;
              const aspectRatio = headImg.height / headImg.width;
              const headHeight = headWidth * aspectRatio;
              const headX = (canvas.width - headWidth) / 2;
              const headY = 50; // Top position
              
              ctx.drawImage(headImg, headX, headY, headWidth, headHeight);
              
              // Add the text
              ctx.font = "bold 39px Arial";
              ctx.fillStyle = "#d4941c";
              ctx.textAlign = "center";
              ctx.fillText(`${userName}`, 823, 905);
              
              setLoading(false);
            };
            
            headImg.src = '/Head.png';
          } else {
            setLoading(false);
          }
        };
        
        templateImg.src = '/Repping.png';
      } catch (error) {
        console.error("Error loading flyer preview:", error);
        setLoading(false);
      }
    };
    
    loadTemplate();
  }, [imageUrl, userName]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="w-full aspect-square relative overflow-hidden rounded-lg shadow-lg"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto"
      />
      
      <div className="absolute top-2 right-2 z-20">
        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">
          Preview
        </div>
      </div>
    </motion.div>
  );
};

export default FlyerPreview;
