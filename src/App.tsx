
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";

// V1 Pages (keep for legacy/landing)
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

// V2 Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import CheckEmailPage from "./pages/auth/CheckEmailPage";
import ConfirmEmailPage from "./pages/auth/ConfirmEmailPage";

// V2 Dashboard Pages (to be created)
import Dashboard from "./pages/Dashboard";
import TemplateEditor from "./pages/TemplateEditor";
import PublicGenerator from "./pages/PublicGenerator";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import PaymentSuccess from "./pages/PaymentSuccess";
import FontManager from "./components/dashboard/FontManager";
import DownloadLimitManager from "./components/dashboard/DownloadLimitManager";

// Dashboard Layout
import DashboardLayout from "./components/dashboard/DashboardLayout";

// Components
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { removeLovableTag } from "./lib/removeLovableTag";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Safely apply the tag removal logic with proper cleanup
    const setupTagRemoval = () => {
      // Only attempt once DOM is fully loaded
      if (typeof window === 'undefined' || 
          !document || 
          document.readyState !== 'complete') {
        return false;
      }
      
      try {
        // Call the function after a sufficient delay to ensure DOM stability
        setTimeout(() => {
          removeLovableTag();
        }, 1500);
        return true;
      } catch (e) {
        console.error("Tag removal error:", e);
        return false;
      }
    };

    // Try immediately if document is ready
    const success = setupTagRemoval();
    
    // If not ready, set up the load event listener
    if (!success) {
      const handleLoad = () => {
        setTimeout(removeLovableTag, 1500);
      };
      
      window.addEventListener('load', handleLoad, { once: true });
      
      // Store cleanup function
      cleanupRef.current = () => {
        window.removeEventListener('load', handleLoad);
      };
    }

    return () => {
      clearTimeout(timer);
      
      // Execute stored cleanup if it exists
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" closeButton />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes (redirect to dashboard if already authenticated) */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <SignUpPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth/check-email" element={<CheckEmailPage />} />
              <Route path="/auth/confirm" element={<ConfirmEmailPage />} />

              {/* Standalone Editor Route for full-screen experience - Matches before DashboardLayout */}
              <Route 
                path="/dashboard/editor/:templateId" 
                element={
                  <ProtectedRoute>
                    <TemplateEditor />
                  </ProtectedRoute>
                }
              />

              {/* Protected Dashboard Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="fonts" element={<FontManager />} />
                <Route path="downloads" element={<DownloadLimitManager />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>

              {/* Payment Routes */}
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/dashboard/subscription/success" element={<PaymentSuccess />} />

              {/* Public Flyer Generator */}
              <Route 
                path="/flyer/:templateId" 
                element={<PublicGenerator />} 
              />

              {/* Legacy V1 Routes (keep for existing users) */}
              <Route path="/editor" element={<Editor />} />
              <Route path="/success" element={<Success />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
