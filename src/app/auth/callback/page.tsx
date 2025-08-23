'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Image from 'next/image';
import Logo from '../../../components/Logo';

export default function AuthCallback() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // Let Supabase handle the OAuth callback automatically
    // The AuthContext will detect the auth state change and update the user
    console.log('OAuth callback page loaded, letting Supabase handle authentication...');
  }, [router]);

  // Wait for auth state to be determined
  useEffect(() => {
    console.log('Auth callback state check:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      onboardingStatus: user?.hasCompletedOnboarding
    });

    if (isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    if (isAuthenticated && user) {
      console.log('User authenticated successfully:', user.email);

      // Always redirect to dashboard first - let dashboard handle onboarding check
      // This prevents race conditions where profile check failed in AuthContext
      console.log('Redirecting to dashboard, will check onboarding status there');
      router.push('/dashboard');
    } else if (!isLoading) {
      // Only redirect to login if we're not loading and definitely not authenticated
      console.log('No authenticated user after loading complete, redirecting to login');
      router.push('/login?error=no_session');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Timeout fallback - only if we're still loading after a reasonable time
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (isLoading) {
        console.log('Auth callback timeout while still loading, redirecting to login');
        router.push('/login?error=timeout');
      }
    }, 15000); // Increased to 15 seconds

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background transition-colors duration-300">
      <div className="text-center">
        <Logo
          width={64}
          height={64}
          className="w-16 h-16 mx-auto mb-4 animate-pulse"
        />
        <p className="text-foreground mb-2">Completing sign in...</p>
        <p className="text-muted-foreground text-sm">This may take a few seconds</p>
      </div>
    </div>
  );
}
