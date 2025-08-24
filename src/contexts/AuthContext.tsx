'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleAuthError, isRefreshTokenError, getSafeSession } from '../lib/auth-utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  profileError: string | null;
  authenticationStage: 'idle' | 'oauth_callback' | 'profile_check' | 'complete';
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkProfileStatus: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authenticationStage, setAuthenticationStage] = useState<'idle' | 'oauth_callback' | 'profile_check' | 'complete'>('idle');

  useEffect(() => {
    // Get initial session function
    const getInitialSession = async () => {
      try {
        const { session, error } = await getSafeSession();

        if (error) {
          console.error('Session error:', error);
          await handleAuthError(error);
          return;
        }

        if (session?.user) {
          const transformedUser = await transformSupabaseUser(session.user);
          setUser(transformedUser);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        await handleAuthError(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            try {
              console.log('Starting user transformation...');
              setAuthenticationStage('oauth_callback');
              const transformedUser = await transformSupabaseUser(session.user);
              setUser(transformedUser);
              console.log('User transformed and set:', transformedUser.email, 'onboarding:', transformedUser.hasCompletedOnboarding);
              // Only set loading to false AFTER user is set
              setIsLoading(false);
            } catch (error) {
              console.error('Error transforming user:', error);
              setAuthenticationStage('complete');
              // Set a basic user object even if transformation fails
              const basicUser = {
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.given_name || '',
                lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.family_name || '',
                fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
                hasCompletedOnboarding: false // Default to false if we can't check
              };
              setUser(basicUser);
              console.log('Set basic user due to transformation error:', basicUser.email);
              // Set loading to false even if transformation failed
              setIsLoading(false);
            }
          } else {
            // No user in session, set loading to false
            setAuthenticationStage('idle');
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthenticationStage('idle');
          console.log('User signed out');
          setIsLoading(false);
        } else {
          // For other events, just set loading to false
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect for session validation on focus
  useEffect(() => {
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { session, error } = await getSafeSession();

          if (error) {
            console.error('Session validation error:', error);
            await handleAuthError(error);
            if (isRefreshTokenError(error)) {
              setUser(null);
            }
          } else if (!session && user) {
            // Session expired, clear user
            setUser(null);
          }
        } catch (error) {
          console.error('Session check failed:', error);
          await handleAuthError(error);
          if (isRefreshTokenError(error)) {
            setUser(null);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user]);



  // Utility function for delays in retry logic
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Enhanced profile status check with retry logic and timeout
  const checkProfileStatusWithRetry = async (userId: string, maxRetries: number = 2, timeoutMs: number = 15000): Promise<boolean> => {
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > timeoutMs - 2000) {
        console.warn('Approaching timeout, skipping further retries');
        break;
      }
      
      try {
        console.log(`Profile check attempt ${attempt}/${maxRetries} for user:`, userId);
        
        // Add timeout to individual query
        const queryPromise = supabase
          .from('user_profiles')
          .select('completed_onboarding')
          .eq('user_id', userId)
          .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!error && profile) {
          console.log('Profile check successful on attempt', attempt, 'result:', profile.completed_onboarding);
          return profile.completed_onboarding === true;
        } else if (!error && !profile) {
          console.log('No profile found on attempt', attempt, '- user needs onboarding');
          return false;
        } else {
          console.warn(`Profile query error on attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            throw error;
          }
        }
      } catch (error) {
        console.warn(`Profile check failed on attempt ${attempt}:`, error);
        if (attempt === maxRetries) {
          console.warn('All profile check attempts failed, assuming onboarding needed');
          return false; // Don't throw, just assume onboarding needed
        }
      }
      
      // Shorter delays to fit within timeout
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * attempt, 2000); // Max 2 seconds delay
        console.log(`Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }
    }
    
    // Fallback: assume onboarding needed if all retries failed
    console.log('Profile check timed out or failed, assuming onboarding needed');
    return false;
  };
  // Enhanced checkProfileStatus function with retry logic
  const checkProfileStatus = async (userId: string): Promise<boolean> => {
    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const result = await checkProfileStatusWithRetry(userId);
      return result;
    } catch (error) {
      console.warn('Profile status check failed after retries:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to check profile');
      return false;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const transformSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    const metadata = supabaseUser.user_metadata || {};
    console.log('Transforming Supabase user:', supabaseUser.email, 'metadata:', metadata);
    setAuthenticationStage('profile_check');

    // Enhanced profile status check with timeout
    let hasCompletedOnboarding = false;
    try {
      console.log('Checking profile status with retry for user:', supabaseUser.email, 'id:', supabaseUser.id);
      
      // Add overall timeout to profile check
      const profileCheckPromise = checkProfileStatusWithRetry(supabaseUser.id);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('Profile check timed out after 15 seconds, assuming onboarding needed');
          resolve(false);
        }, 15000);
      });
      
      hasCompletedOnboarding = await Promise.race([profileCheckPromise, timeoutPromise]);
      console.log('Final profile status result:', hasCompletedOnboarding);
    } catch (error) {
      console.warn('Profile check with retry failed, assuming onboarding needed:', error);
      hasCompletedOnboarding = false;
    }

    const transformedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName: metadata.first_name || metadata.given_name || '',
      lastName: metadata.last_name || metadata.family_name || '',
      fullName: metadata.full_name || metadata.name || '',
      avatarUrl: metadata.avatar_url || metadata.picture || '',
      hasCompletedOnboarding
    };

    console.log('User transformation complete:', {
      email: transformedUser.email,
      hasCompletedOnboarding: transformedUser.hasCompletedOnboarding,
      fullName: transformedUser.fullName
    });
    
    setAuthenticationStage('complete');
    return transformedUser;
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(await transformSupabaseUser(data.user));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            full_name: `${userData.firstName} ${userData.lastName}`.trim()
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(await transformSupabaseUser(data.user));
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use consistent redirect URL that matches Supabase configuration
      const redirectUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000/auth/callback'
        : 'https://swiftlog-beta.vercel.app/auth/callback';

      console.log('Starting Google OAuth with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Always clear the user state first
      setUser(null);
      
      // Try to sign out from Supabase, but handle session errors gracefully
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Check if it's a session-related error that we can ignore
        if (error.message?.includes('Auth session missing') || 
            error.message?.includes('session_not_found') ||
            error.message?.includes('Forbidden')) {
          console.log('Session already invalid, logout completed locally');
          // Session was already invalid, which is fine for logout
          return;
        }
        
        // For other errors, log but don't throw
        console.warn('Logout warning (non-critical):', error);
      }
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.warn('Logout error (handled gracefully):', error);
      // Even if logout fails, we've cleared the local user state
      // This ensures the user is logged out from the app's perspective
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user session and profile status...');
      const { session, error } = await getSafeSession();
      if (error) {
        console.error('Refresh user session error:', error);
        await handleAuthError(error);
        if (isRefreshTokenError(error)) {
          setUser(null);
        }
        return;
      }

      if (session?.user) {
        const transformedUser = await transformSupabaseUser(session.user);
        setUser(transformedUser);
        console.log('User refreshed successfully:', transformedUser.email, 'onboarding:', transformedUser.hasCompletedOnboarding);
      } else {
        console.log('No session found during refresh');
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await handleAuthError(error);
      if (isRefreshTokenError(error)) {
        setUser(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isProfileLoading,
    profileError,
    authenticationStage,
    login,
    signup,
    signInWithGoogle,
    logout,
    refreshUser,
    checkProfileStatus,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
