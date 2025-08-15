/**
 * Authentication Hook
 * Manages user authentication state and provides auth methods
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Refs to prevent multiple concurrent profile loads and track mounted state
  const isLoadingProfileRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastSessionRef = useRef<Session | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Load user profile data with deduplication and error handling
   */
  const loadProfile = useCallback(async (user: User | null, forceReload = false) => {
    if (!user) {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, profile: null }));
      }
      return;
    }

    // Prevent concurrent profile loading unless forced
    if (isLoadingProfileRef.current && !forceReload) {
      console.log('⏳ Profile loading already in progress, skipping...');
      return;
    }

    isLoadingProfileRef.current = true;

    try {
      console.log('📋 Loading profile for user:', user.email);
      const profile = await getCurrentProfile();
      
      if (isMountedRef.current) {
        console.log('✅ Profile loaded successfully:', profile?.email);
        setState(prev => ({ ...prev, profile }));
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      
      if (isMountedRef.current) {
        // Only show error toast for genuine failures, not for normal auth state changes
        if (error.message?.includes('Failed to create profile')) {
          toast.error('Failed to set up user profile. Please try refreshing the page.');
        } else if (!error.message?.includes('User not authenticated')) {
          console.warn('Profile load failed:', error.message);
          // Don't show error toast for session expiry or normal auth flows
        }
        
        setState(prev => ({ ...prev, profile: null }));
      }
    } finally {
      isLoadingProfileRef.current = false;
    }
  }, []);

  /**
   * Handle authentication state changes with improved session management
   */
  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('🔐 Initial session check:', session?.user?.email || 'No user');
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          initializing: false,
        }));
        
        lastSessionRef.current = session;

        if (session?.user && !isLoadingProfileRef.current) {
          await loadProfile(session.user);
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        if (mounted) {
          setState(prev => ({ ...prev, initializing: false }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with deduplication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        // Check if this is a duplicate session event
        const isDuplicateSession = lastSessionRef.current?.access_token === session?.access_token &&
                                   lastSessionRef.current?.user?.id === session?.user?.id;
        
        if (isDuplicateSession && event !== 'SIGNED_OUT') {
          console.log('⏭️ Skipping duplicate session event');
          return;
        }
        
        lastSessionRef.current = session;
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
        }));

        // Load profile only for relevant events and if not already loading
        if (session?.user && ['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event) && !isLoadingProfileRef.current) {
          await loadProfile(session.user, event === 'SIGNED_IN');
        }
        
        // Clear profile when user signs out
        if (event === 'SIGNED_OUT') {
          isLoadingProfileRef.current = false;
          setState(prev => ({ ...prev, profile: null }));
        }
      }
    );
    
    // Handle tab visibility changes to refresh session if needed - DISABLED to prevent loops
    // const handleVisibilityChange = async () => {
    //   if (document.visibilityState === 'visible' && mounted) {
    //     console.log('🔄 Tab focus/visibility - checking session...');
        
    //     try {
    //       // Only refresh if we have a user but the session might be stale
    //       const { data: { session } } = await supabase.auth.getSession();
          
    //       if (session?.user && !state.profile && !isLoadingProfileRef.current) {
    //         console.log('🔄 Refreshing profile after tab focus');
    //         await loadProfile(session.user, true);
    //       }
    //     } catch (error) {
    //       console.warn('⚠️ Session check on tab focus failed:', error);
    //     }
    //   }
    // };
    
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    // window.addEventListener('focus', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      // window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [loadProfile, state.profile]);

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
    if (state.user && isMountedRef.current) {
      console.log('🔄 Manually refreshing profile...');
      await loadProfile(state.user, true); // Force reload
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