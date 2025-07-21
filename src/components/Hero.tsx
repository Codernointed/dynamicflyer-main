import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="page-container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }} 
            className="text-4xl font-bold tracking-tight text-gradient leading-tight mb-6 md:text-7xl"
          >
            Create Amazing Flyers in Minutes
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }} 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Design beautiful flyer templates, share them with anyone, and let people create personalized versions with their own photos and details. No design skills required!
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Primary CTA - Sign Up */}
            <Button asChild size="lg" className="px-8 py-3">
              <Link to="/signup" className="group inline-flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Start Creating for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            {/* Secondary CTA - Sign In */}
            <Button asChild variant="outline" size="lg" className="px-8 py-3">
              <Link to="/login" className="inline-flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sign In
              </Link>
            </Button>
          </motion.div>

          {/* Legacy Quick Access */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 pt-8 border-t border-border/50"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Looking for the legacy editor?
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link 
                to="/editor" 
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  // Force navigation on mobile
                  window.location.href = "/editor";
                }}
              >
                Use Legacy UPSA MBA Editor
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary/20 animate-pulse" />
      <div className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-secondary/30 animate-bounce" />
      <div className="absolute top-40 right-1/3 w-1 h-1 rounded-full bg-primary/40" />
    </div>
  );
};

export default Hero;