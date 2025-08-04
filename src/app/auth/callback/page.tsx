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
        console.log('URL hash:', window.location.hash);
        console.log('URL search:', window.location.search);

        // First, try to get the current session (might already be set by Supabase)
        const { data: currentSession, error: currentError } = await supabase.auth.getSession();

        if (currentSession?.session) {
          console.log('Found existing session');
          await handleSuccessfulAuth(currentSession.session);
          return;
        }

        // If no current session, try to exchange code for session
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          console.log('Found auth code/token in URL, attempting exchange');

          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

            if (error) {
              console.error('Code exchange error:', error);
              throw error;
            }

            if (data.session) {
              console.log('Successfully exchanged code for session');
              await handleSuccessfulAuth(data.session);
              return;
            }
          } catch (exchangeError) {
            console.error('Exchange failed, trying alternative method:', exchangeError);
          }
        }

        // Wait a bit and try again (sometimes the session takes time to be available)
        console.log('Waiting for session to be available...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: delayedSession } = await supabase.auth.getSession();
        if (delayedSession?.session) {
          console.log('Found session after delay');
          await handleSuccessfulAuth(delayedSession.session);
          return;
        }

        // If still no session, redirect to login
        console.log('No session found after all attempts, redirecting to login');
        router.push('/login?error=no_session');

      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    const handleSuccessfulAuth = async (session: any) => {
      try {
        console.log('Session found in callback:', session.user.email);

        // Check if user has completed onboarding
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('completed_onboarding')
          .eq('user_id', session.user.id)
          .single();

        if (profileData?.completed_onboarding) {
          console.log('Redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('Redirecting to onboarding');
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error handling successful auth:', error);
        router.push('/onboarding'); // Default to onboarding if profile check fails
      }
    };

    // Small delay to ensure URL params are available
    const timer = setTimeout(handleAuthCallback, 100);

    // Timeout fallback - if nothing happens in 10 seconds, redirect to login
    const timeoutTimer = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      router.push('/login?error=timeout');
    }, 10000);

    return () => {
      clearTimeout(timer);
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
