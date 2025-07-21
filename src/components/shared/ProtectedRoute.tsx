/**
 * Protected Route Component
 * Wrapper that ensures only authenticated users can access certain routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Protected Route Wrapper
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  // Show loading spinner while initializing auth state
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If auth is not required but user is authenticated, might want to redirect (for login/signup pages)
  if (!requireAuth && user) {
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

/**
 * Auth Guard Hook
 * For use in components that need to check auth status
 */
export function useAuthGuard() {
  const { user, initializing, loading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: initializing || loading,
    user
  };
} 