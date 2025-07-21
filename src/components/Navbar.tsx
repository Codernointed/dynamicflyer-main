import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    // Close mobile menu when changing routes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/70 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <motion.div 
              initial={{
                scale: 0.9,
                opacity: 0
              }} 
              animate={{
                scale: 1,
                opacity: 1
              }} 
              transition={{
                duration: 0.3
              }} 
              className="font-bold text-xl tracking-tight bg-inherit"
            >
              Fill the UPSA Auditorium with MBA
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" label="Home" />
            <NavLink to="/editor" label="Create Flyer" />
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex items-center" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{
            opacity: 0,
            y: -10
          }} 
          animate={{
            opacity: 1,
            y: 0
          }} 
          exit={{
            opacity: 0,
            y: -10
          }} 
          transition={{
            duration: 0.2
          }} 
          className="md:hidden fixed inset-x-0 top-16 glass py-4 px-6 z-[100] touch-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <nav className="flex flex-col gap-4">
            <MobileNavLink to="/" label="Home" onClick={handleLinkClick} />
            <MobileNavLink to="/editor" label="Create Flyer" onClick={handleLinkClick} />
          </nav>
        </motion.div>
      )}
    </header>
  );
};

interface NavLinkProps {
  to: string;
  label: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`px-2 py-1.5 transition-colors duration-200 rounded-md ${
        isActive 
          ? "font-medium text-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {label}
    </Link>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ to, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`py-2 block transition-colors duration-200 touch-auto active:opacity-75 ${
        isActive ? "font-semibold" : "text-muted-foreground"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
        // Force navigation on mobile
        window.location.href = to;
      }}
    >
      {label}
    </Link>
  );
};

export default Navbar;
