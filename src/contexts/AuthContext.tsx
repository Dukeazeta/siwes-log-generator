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
              const transformedUser = await transformSupabaseUser(session.user);
              setUser(transformedUser);
              console.log('User transformed and set:', transformedUser.email, 'onboarding:', transformedUser.hasCompletedOnboarding);
              // Only set loading to false AFTER user is set
              setIsLoading(false);
            } catch (error) {
              console.error('Error transforming user:', error);
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
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
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



  // Separate function to check profile status with proper state management
  const checkProfileStatus = async (userId: string): Promise<boolean> => {
    setIsProfileLoading(true);
    setProfileError(null);

    try {
      console.log('Checking profile for user:', userId);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('completed_onboarding')
        .eq('user_id', userId)
        .single();

      if (!error && profile) {
        console.log('Profile check successful:', {
          userId,
          completed_onboarding: profile.completed_onboarding
        });
        return profile.completed_onboarding === true;
      } else if (error && error.code === 'PGRST116') {
        // No profile found - user needs onboarding
        console.log('No profile found, user needs onboarding');
        return false;
      } else {
        // Other errors
        console.warn('Profile query error:', error);
        setProfileError(error.message || 'Failed to check profile');
        return false;
      }
    } catch (error) {
      console.warn('Profile query failed:', error);
      setProfileError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const transformSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    const metadata = supabaseUser.user_metadata || {};
    console.log('Transforming Supabase user:', supabaseUser.email, 'metadata:', metadata);

    // For Google OAuth users, we should be more reliable about checking profile status
    let hasCompletedOnboarding = false;
    try {
      console.log('Checking profile status for user:', supabaseUser.email, 'id:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('completed_onboarding')
        .eq('user_id', supabaseUser.id)
        .single();

      console.log('Profile check result:', { profile, error, code: error?.code });

      if (!error && profile) {
        hasCompletedOnboarding = profile.completed_onboarding === true;
        console.log('Profile found, onboarding status:', hasCompletedOnboarding);
      } else if (error && error.code === 'PGRST116') {
        // No profile found - user definitely needs onboarding
        hasCompletedOnboarding = false;
        console.log('No profile found - user needs onboarding');
      } else {
        // Database error - be conservative and assume onboarding needed
        console.warn('Profile check error:', error);
        hasCompletedOnboarding = false;
      }
    } catch (error) {
      console.warn('Profile check failed, assuming onboarding needed:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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
