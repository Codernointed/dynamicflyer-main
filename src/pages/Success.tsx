import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Download, ArrowLeft, Home, Share2, Instagram, Send, MessageCircle, Facebook } from "lucide-react";
import { toast } from "sonner";

const Success = () => {
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("flyerName");
    const storedImage = localStorage.getItem("flyerImage");

    if (!storedName || !storedImage) {
      toast.error("No flyer data found. Please create a new flyer.");
      navigate("/generator");
      return;
    }

    setName(storedName);
    setImageUrl(storedImage);
  }, [navigate]);

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${name}-flyer.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Flyer downloaded successfully!");
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      // Convert base64 to blob
      const base64Response = await fetch(imageUrl);
      const blob = await base64Response.blob();
      const file = new File([blob], `${name}-flyer.png`, { type: 'image/png' });

      // Check if native file sharing is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'UPSA MBA Flyer',
          });
          return;
        } catch (err) {
          console.log('Native share failed, falling back to alternative', err);
        }
      }

      // Fallback: Create shareable URL
      const blobUrl = URL.createObjectURL(blob);
      
      if (/mobile/i.test(navigator.userAgent)) {
        // Mobile fallback - download and show success message
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${name}-flyer.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Image saved! You can now share it through your preferred app");
      } else {
        // Desktop fallback - open in new tab for saving
        window.open(blobUrl, '_blank');
      }
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (error) {
      console.error('Share failed:', error);
      toast.error("Couldn't share image. Please try downloading instead.");
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      action: async () => {
        if (!imageUrl) return;
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${name}-flyer.png`, { type: 'image/png' });

          // Try native sharing first
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'UPSA MBA Flyer',
            });
            return;
          }

          // WhatsApp fallback
          const blobUrl = URL.createObjectURL(blob);
          
          // Download image first
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${name}-flyer.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Open WhatsApp
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const whatsappUrl = isMobile 
            ? 'whatsapp://send' 
            : 'https://web.whatsapp.com';
          
          window.open(whatsappUrl, '_blank');
          toast.success("Image saved! Now you can share it on WhatsApp");

          // Cleanup
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        } catch (error) {
          console.error('WhatsApp share failed:', error);
          toast.error("Couldn't share to WhatsApp. Please try downloading instead.");
        }
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      action: async () => {
        if (!imageUrl) return;
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${name}-flyer.png`, { type: 'image/png' });

          // Try native sharing first
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'UPSA MBA Flyer',
            });
            return;
          }

          // Instagram fallback
          const blobUrl = URL.createObjectURL(blob);
          
          // Download image first
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${name}-flyer.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Open Instagram
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          window.open(isMobile ? 'instagram://' : 'https://instagram.com', '_blank');
          toast.success("Image saved! Now you can share it on Instagram");

          // Cleanup
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        } catch (error) {
          console.error('Instagram share failed:', error);
          toast.error("Couldn't share to Instagram. Please try downloading instead.");
        }
      }
    },
    {
      name: 'Telegram',
      icon: Send,
      color: '#0088cc',
      action: () => {
        const text = encodeURIComponent("Join me at UPSA MBA! Check out my flyer 🎓");
        window.open(`https://t.me/share/url?url=${window.location.href}&text=${text}`, '_blank');
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877f2',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
      }
    }
  ];

  return (
    <Layout>
      <div className="page-container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Share your flyer 😎!
            </h1>
            <p className="text-muted-foreground mb-8">
              You have created it nicely charle lets share and rep ourselves.
            </p>
          </div>
            {imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="max-w-[1080px] mx-auto mb-6 rounded-lg overflow-hidden shadow-lg">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 z-10" />
                <img
                src={imageUrl}
                alt="Your flyer"
                className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              </div>
            </motion.div>
            )}

          <div className="flex flex-col gap-6 mt-8">
            <div className="hidden md:block">
              <h3 className="text-base font-medium mb-4">Share your flyer</h3>
              <div className="inline-flex items-center gap-3">
                {shareLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={link.action}
                    className="group flex flex-col items-center gap-1.5 p-2 hover:scale-105 transition-all"
                    title={`Share on ${link.name}`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: `${link.color}20` }}
                    >
                      <link.icon 
                        className="h-5 w-5 transition-colors" 
                        style={{ color: link.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      {link.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* <button
                onClick={handleDownload}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-all active:scale-95"
              >
                <Download className="h-4 w-4 inline-block mr-2" />
                Download Flyer
              </button> */}

              <Link
                to="/editor"
                className="w-full sm:w-auto"
              >
                <button className="w-full border border-input bg-background px-5 py-2.5 rounded-full font-medium text-sm hover:bg-secondary/50 transition-all active:scale-95">
                  <ArrowLeft className="h-4 w-4 inline-block mr-2" />
                  Create Another
                </button>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-16">
            <Link
              to="/"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:hidden">
            <div className="flex items-center justify-around p-3 bg-background/95 backdrop-blur-md border-t border-border">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={link.action}
                  className="flex flex-col items-center gap-1"
                >
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${link.color}15` }}
                  >
                    <link.icon 
                      className="h-4 w-4" 
                      style={{ color: link.color }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Success;
