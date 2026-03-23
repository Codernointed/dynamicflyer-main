/**
 * Dashboard Layout Component
 * Main layout for authenticated dashboard pages with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed on mobile, open controlled by effect
  const { user, profile, signOut } = useAuth();

  // Handle default sidebar state based on screen size
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setSidebarOpen(!isMobile);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop and Mobile */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-[70] w-[280px] md:relative md:z-auto shadow-2xl md:shadow-none"
          >
            <DashboardSidebar 
              onClose={() => setSidebarOpen(false)} 
              onToggle={toggleSidebar}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen relative">
        {/* Top header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xl px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`flex transition-transform duration-200 ${sidebarOpen ? 'md:rotate-180' : ''}`}
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </Button>
            
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                <span className="hidden sm:inline bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Design Dashboard
                </span>
                <span className="sm:hidden text-slate-900">GenEdit</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Welcome, {profile?.full_name || user?.email?.split('@')[0]}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-0 scroll-smooth">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
 