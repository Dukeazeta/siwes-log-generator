'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  useEffect(() => {
    // Get initial session function
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (session?.user) {
          const transformedUser = await transformSupabaseUser(session.user);
          setUser(transformedUser);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Don't block app initialization on session errors
      } finally {
        setIsLoading(false);
      }
    };

    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const transformedUser = await transformSupabaseUser(session.user);
            setUser(transformedUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }

        // Only set loading to false after we've processed the auth change
        if (event !== 'TOKEN_REFRESHED') {
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
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session && user) {
            // Session expired, clear user
            setUser(null);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user]);



  const transformSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    const metadata = supabaseUser.user_metadata || {};

    // Check if user has completed onboarding
    let hasCompletedOnboarding = false;
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('completed_onboarding')
        .eq('user_id', supabaseUser.id)
        .single();

      if (!error && profile) {
        hasCompletedOnboarding = profile.completed_onboarding === true;
      }
    } catch (error) {
      console.warn('Profile query failed, assuming onboarding not completed:', error);
      hasCompletedOnboarding = false;
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName: metadata.first_name || metadata.given_name || '',
      lastName: metadata.last_name || metadata.family_name || '',
      fullName: metadata.full_name || metadata.name || '',
      avatarUrl: metadata.avatar_url || metadata.picture || '',
      hasCompletedOnboarding
    };
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
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
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const transformedUser = await transformSupabaseUser(supabaseUser);
        setUser(transformedUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    logout,
    refreshUser,
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
