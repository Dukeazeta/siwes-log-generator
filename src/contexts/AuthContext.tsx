"use client";

import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

// Types
interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  institution: string;
  course_of_study: string;
  matric_number: string;
  company_name: string;
  company_address: string;
  supervisor_name: string;
  supervisor_phone: string;
  start_date: string;
  end_date: string;
  completed_onboarding: boolean;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  hasCompletedOnboarding: boolean;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simple state - no reducer needed
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Refs for stable access in callbacks without causing re-renders
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const isMountedRef = useRef(true);

  // Update refs when state changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Load profile - completely decoupled from auth state
  const loadProfile = useCallback(async (userId: string) => {
    if (!isMountedRef.current) return;

    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!isMountedRef.current) return;

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
      } else {
        console.log("Profile loaded successfully");
        setProfile(data);
      }
    } catch (error) {
      console.error("Profile load exception:", error);
      if (isMountedRef.current) {
        setProfile(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingProfile(false);
      }
    }
  }, []);

  // Transform Supabase user to our User type
  const transformUser = useCallback(
    (supabaseUser: SupabaseUser | null, profile: UserProfile | null): User | null => {
      if (!supabaseUser) return null;

      const metadata = supabaseUser.user_metadata || {};

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        firstName: profile?.first_name || metadata.first_name || metadata.given_name,
        lastName: profile?.last_name || metadata.last_name || metadata.family_name,
        fullName:
          metadata.full_name ||
          metadata.name ||
          (profile ? `${profile.first_name} ${profile.last_name}`.trim() : undefined),
        avatarUrl: metadata.avatar_url || metadata.picture,
        hasCompletedOnboarding: profile?.completed_onboarding === true,
        profile: profile || undefined,
      };
    },
    [],
  );

  // Stable auth state change handler - uses refs, not state
  const handleAuthStateChange = useCallback(
    async (event: string, newSession: Session | null) => {
      console.log(`Auth state change: ${event}`);

      switch (event) {
        case "SIGNED_IN":
          if (newSession) {
            setSession(newSession);
            // Load profile in parallel, don't await
            loadProfile(newSession.user.id);
          }
          break;

        case "SIGNED_OUT":
          setSession(null);
          setProfile(null);
          break;

        case "TOKEN_REFRESHED":
          if (newSession) {
            setSession(newSession);
          }
          break;

        case "USER_UPDATED":
          if (newSession) {
            setSession(newSession);
            // Reload profile to get any updates
            loadProfile(newSession.user.id);
          }
          break;
      }
    },
    [loadProfile],
  );

  // Initialize auth - runs ONCE on mount
  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");

        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Initial session error:", error);
          setSession(null);
        } else if (initialSession) {
          console.log("Initial session found");
          setSession(initialSession);
          // Load profile in parallel
          loadProfile(initialSession.user.id);
        } else {
          console.log("No initial session");
          setSession(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoadingSession(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth listener - ONCE
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Skip initial session as we handle it above
      if (event === "INITIAL_SESSION") {
        return;
      }

      handleAuthStateChange(event, session);
    });

    // Cleanup
    return () => {
      mounted = false;
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, loadProfile]); // These are stable, won't cause re-runs

  // Stable auth methods with no dependencies
  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Session will be handled by auth state listener
    return;
  }, []);

  const signup = useCallback(async (userData: SignupData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    // Session will be handled by auth state listener
    return;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error && !error.message?.includes("session_not_found")) {
      throw error;
    }

    // State will be cleared by auth state listener
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (currentSession?.user) {
      await loadProfile(currentSession.user.id);
    }
  }, [loadProfile]);

  // Compute derived values
  const user = useMemo(
    () => transformUser(session?.user || null, profile),
    [session?.user, profile, transformUser],
  );

  const isAuthenticated = Boolean(session?.user);
  const isLoading = isLoadingSession;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isProfileLoading: isLoadingProfile,
      isAuthenticated,
      login,
      signup,
      signInWithGoogle,
      logout,
      refreshProfile,
    }),
    [
      user,
      isLoading,
      isLoadingProfile,
      isAuthenticated,
      login,
      signup,
      signInWithGoogle,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export types for use in other files
export type { AuthContextType, User, UserProfile };
