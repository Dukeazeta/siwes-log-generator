'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Image from 'next/image';

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
    if (isLoading) {
      console.log('Auth loading...');
      return;
    }

    if (isAuthenticated && user) {
      console.log('User authenticated:', user.email);

      // Redirect based on onboarding status
      if (user.hasCompletedOnboarding) {
        console.log('Redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('Redirecting to onboarding');
        router.push('/onboarding');
      }
    } else {
      console.log('No authenticated user, redirecting to login');
      router.push('/login?error=no_session');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Timeout fallback
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      router.push('/login?error=timeout');
    }, 10000);

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Image
          src="/LOGOS/SwiftLog.svg"
          alt="SwiftLog Logo"
          width={64}
          height={64}
          priority
          className="w-16 h-16 mx-auto mb-4 animate-pulse"
        />
        <p className="text-gray-600 mb-2">Completing sign in...</p>
        <p className="text-gray-400 text-sm">This may take a few seconds</p>
      </div>
    </div>
  );
}
