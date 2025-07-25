import React from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Background Image on the Right - Dynamic opacity */}
      <div
        className="absolute top-[0%] -right-1/4 sm:right-0 w-full sm:w-1/2 lg:w-1/3 
                   h-[90%] sm:h-full bg-no-repeat pointer-events-none 
                   transform scale-[0.8] sm:scale-100
                   opacity-[0.15] sm:opacity-30 md:opacity-50 lg:opacity-100"
        style={{
          backgroundImage: "url('/asset2.jpeg')",
          backgroundSize: "contain",
          backgroundPosition: "center right",
        }}
      />

      {/* Background Image on the Bottom Left - Dynamic opacity */}
      <div
        className="absolute -bottom-[10%] sm:bottom-0 -left-1/4 sm:left-0 
                   w-full sm:w-1/2 lg:w-1/3 h-[60%] sm:h-2/3 
                   bg-no-repeat pointer-events-none 
                   transform scale-[0.8] sm:scale-80
                   opacity-[0.15] sm:opacity-30 md:opacity-50 lg:opacity-100"
        style={{
          backgroundImage: "url('/asset3.jpeg')",
          backgroundSize: "contain",
          backgroundPosition: "bottom left",
        }}
      />

      {/* Navbar with improved mobile spacing */}
      <Navbar />

      {/* Head Image at the Top - Responsive sizing */}
      <div className="relative z-10 flex justify-center mt-4 sm:mt-6 px-4">
        <img
          src="/asset1.png"
          alt="Head"
          className="w-24 h-auto sm:w-32 md:w-40 lg:w-48 
                     transform scale-90 sm:scale-100
                     transition-transform duration-300"
        />
      </div>

      {/* Main Content - Improved mobile padding */}
      <motion.main
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-grow relative z-10 px-4 sm:px-6 md:px-8"
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </motion.main>

      {/* Footer - Responsive spacing */}
      <footer className="py-4 sm:py-6 border-t border-border/30 relative z-10 mt-8">
        <div className="page-container text-center text-muted-foreground text-xs sm:text-sm px-4">
          <p>© {new Date().getFullYear()} Faith Constellation Web Team. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
