import React from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Full Background Image - asset3.jpeg */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/asset3.jpeg')",
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Navbar with improved mobile spacing */}
      <Navbar />

      {/* Head Image at the Top - Responsive sizing */}
      <div className="relative z-10 flex justify-center mt-2 sm:mt-4 px-4">
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
        className="flex-grow relative z-10 px-4 sm:px-6 md:px-8 -mt-4 sm:-mt-6"
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </motion.main>

      {/* Footer - Responsive spacing */}
      <footer className="py-4 sm:py-6 border-t border-white/20 relative z-10 mt-8">
        <div className="page-container text-center text-white/80 text-xs sm:text-sm px-4">
          <p>© {new Date().getFullYear()} Infinity Generation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
