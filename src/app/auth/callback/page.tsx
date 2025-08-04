'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);

        // Check for error parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        // Wait for Supabase to process the OAuth callback
        console.log('Waiting for Supabase to process OAuth callback...');

        // Give Supabase time to process the callback
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('Session check result:', {
          session: session ? {
            user: session.user.email,
            expires_at: session.expires_at,
            access_token: session.access_token ? 'present' : 'missing'
          } : null,
          error: sessionError
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login?error=session_error');
          return;
        }

        if (session) {
          console.log('Session found:', session.user.email);

          // Check if user has completed onboarding
          try {
            console.log('Checking user profile for onboarding status...');
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('completed_onboarding')
              .eq('user_id', session.user.id)
              .single();

            console.log('Profile check result:', { profileData, profileError });

            if (profileError) {
              console.error('Profile query error:', profileError);
              // Default to onboarding if we can't check profile
              console.log('Defaulting to onboarding due to profile error');
              router.push('/onboarding');
              return;
            }

            if (profileData?.completed_onboarding) {
              console.log('User has completed onboarding, redirecting to dashboard');
              router.push('/dashboard');
            } else {
              console.log('User needs to complete onboarding');
              router.push('/onboarding');
            }
          } catch (profileError) {
            console.error('Error checking profile:', profileError);
            // Default to onboarding if we can't check profile
            console.log('Defaulting to onboarding due to profile exception');
            router.push('/onboarding');
          }
        } else {
          console.log('No session found, redirecting to login');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    // Start the callback handling immediately
    handleAuthCallback();

    // Timeout fallback - 10 seconds should be enough
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
