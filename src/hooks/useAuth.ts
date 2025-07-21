/**
 * Authentication Hook
 * Manages user authentication state and provides auth methods
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/integrations/supabase/types';
import { 
  signUp as apiSignUp, 
  signIn as apiSignIn, 
  signOut as apiSignOut,
  getCurrentProfile 
} from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export type AuthContextType = AuthState & AuthActions;

/**
 * Custom hook for authentication
 */
export function useAuth(): AuthContextType {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: false,
    initializing: true,
  });

  /**
   * Load user profile data
   */
  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setState(prev => ({ ...prev, profile: null }));
      return;
    }

    try {
      console.log('Loading profile for user:', user.email);
      const profile = await getCurrentProfile();
      console.log('Profile loaded successfully:', profile);
      setState(prev => ({ ...prev, profile }));
    } catch (error: any) {
      console.error('Error loading profile:', error);
      console.error('User details:', { id: user.id, email: user.email });
      
      // Show user-friendly error message
      if (error.message?.includes('Failed to create profile')) {
        toast.error('Failed to set up user profile. Please try refreshing the page.');
      } else {
        toast.error('Failed to load user profile. Please try again.');
      }
      
      setState(prev => ({ ...prev, profile: null }));
    }
  }, []);

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          initializing: false,
        }));

        if (session?.user) {
          await loadProfile(session.user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setState(prev => ({ ...prev, initializing: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
        }));

        // Load profile when user signs in
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await loadProfile(session.user);
        }
        
        // Clear profile when user signs out
        if (event === 'SIGNED_OUT') {
          setState(prev => ({ ...prev, profile: null }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Sign up a new user
   */
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await apiSignUp(email, password, fullName);
      toast.success('Account created! Please check your email to verify your account.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await apiSignIn(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await apiSignOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Failed to sign out');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Refresh user profile data
   */
  const refreshProfile = useCallback(async () => {
    if (state.user) {
      await loadProfile(state.user);
    }
  }, [state.user, loadProfile]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
} 