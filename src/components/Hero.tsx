import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Zap, Palette, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="page-container py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }} 
            className="text-4xl font-bold tracking-tight text-white leading-tight mb-1 md:text-7xl drop-shadow-lg"
          >
            Create Amazing Flyers in Minutes
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }} 
            className="text-lg md:text-xl text-white max-w-3xl mx-auto mb-12 drop-shadow-md"
          >
            Design beautiful flyer templates, share them with anyone, and let people create personalized versions with their own photos and details. No design skills required!
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            {/* Primary CTA - Sign Up */}
            <Button asChild size="lg" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0">
              <Link to="/signup" className="group inline-flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Start Creating for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            {/* Secondary CTA - Sign In */}
            <Button asChild variant="outline" size="lg" className="px-8 py-4 border-white text-amber-600 hover:bg-white hover:text-gray-900">
              <Link to="/login" className="inline-flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sign In
              </Link>
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center p-6 rounded-lg bg-black/40 backdrop-blur-sm border border-white/30 shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Beautiful Templates</h3>
              <p className="text-white/90 drop-shadow-sm">Professional designs that look great on any device</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-black/40 backdrop-blur-sm border border-white/30 shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Lightning Fast</h3>
              <p className="text-white/90 drop-shadow-sm">Create and customize flyers in minutes, not hours</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-black/40 backdrop-blur-sm border border-white/30 shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Easy Sharing</h3>
              <p className="text-white/90 drop-shadow-sm">Share templates and let others personalize them</p>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-amber-500/40 animate-pulse" />
      <div className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-yellow-500/60 animate-bounce" />
      <div className="absolute top-40 right-1/3 w-1 h-1 rounded-full bg-amber-500/60" />
    </div>
  );
};

export default Hero;