'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);

        // Check if we have auth fragments in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        console.log('URL params:', Object.fromEntries(urlParams));
        console.log('Hash params:', Object.fromEntries(hashParams));

        // Wait for Supabase to process the OAuth callback
        // Use exponential backoff to check for session
        let session = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!session && attempts < maxAttempts) {
          attempts++;
          const waitTime = Math.min(1000 * Math.pow(1.5, attempts - 1), 5000); // Max 5 seconds

          console.log(`Attempt ${attempts}: Checking for session (waiting ${waitTime}ms)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          const { data: { session: currentSession }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Session error:', error);
            if (attempts >= maxAttempts) {
              router.push('/login?error=session_error');
              return;
            }
            continue;
          }

          session = currentSession;
        }

        if (session) {
          console.log('Session found:', session.user.email);

          // Check if user has completed onboarding
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('completed_onboarding')
              .eq('user_id', session.user.id)
              .single();

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
            router.push('/onboarding');
          }
        } else {
          console.log('No session found after all attempts, redirecting to login');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    // Start the callback handling
    handleAuthCallback();

    // Extended timeout fallback (30 seconds)
    const timeoutTimer = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      router.push('/login?error=timeout');
    }, 30000);

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Completing sign in...</p>
        <p className="text-gray-400 text-sm">This may take a few seconds</p>
      </div>
    </div>
  );
}
