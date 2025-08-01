/**
 * Auth Layout Component
 * Beautiful layout for authentication pages (login/signup)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonTo?: string;
}

export default function AuthLayout({ 
  children, 
  showBackButton = true,
  backButtonText = "Back to Home",
  backButtonTo = "/"
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="font-bold text-xl tracking-tight"
            >
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Infinity Generation
              </span>
            </motion.div>
          </Link>

          {/* Back Button */}
          {showBackButton && (
            <Button variant="ghost" asChild>
              <Link to={backButtonTo} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{backButtonText}</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated background shapes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-10 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.04, scale: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-r from-amber-400/50 to-yellow-500/50"
        />
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0] 
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-20 right-20 w-3 h-3 rounded-full bg-amber-400/20"
        />
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -3, 0] 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute bottom-32 left-20 w-2 h-2 rounded-full bg-yellow-500/30"
        />
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, 5, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2 
          }}
          className="absolute top-40 left-1/3 w-1 h-1 rounded-full bg-amber-400/40"
        />
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Infinity Generation. All rights reserved.</p>
      </footer>
    </div>
  );
} 