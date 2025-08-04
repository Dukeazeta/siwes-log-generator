'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let hasRedirected = false;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change in callback:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session && !hasRedirected) {
        hasRedirected = true;
        console.log('Caught SIGNED_IN event, redirecting...');
        await handleSuccessfulAuth(session);
      }
    });

    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);
        console.log('URL hash:', window.location.hash);
        console.log('URL search:', window.location.search);

        // Wait a moment for Supabase to process the auth state change
        await new Promise(resolve => setTimeout(resolve, 500));

        // First, try to get the current session (might already be set by Supabase)
        const { data: currentSession } = await supabase.auth.getSession();

        if (currentSession?.session) {
          console.log('Found existing session, user:', currentSession.session.user.email);
          await handleSuccessfulAuth(currentSession.session);
          return;
        }

        // If no current session, try to exchange code for session
        if (window.location.search.includes('code=')) {
          console.log('Found auth code in URL, attempting exchange');

          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

            if (error) {
              console.error('Code exchange error:', error);
              // Don't throw immediately, try waiting for auth state change
            } else if (data.session) {
              console.log('Successfully exchanged code for session');
              await handleSuccessfulAuth(data.session);
              return;
            }
          } catch (exchangeError) {
            console.error('Exchange failed:', exchangeError);
          }
        }

        // Wait longer for auth state change to propagate
        console.log('Waiting for auth state change to complete...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: delayedSession } = await supabase.auth.getSession();
        if (delayedSession?.session) {
          console.log('Found session after waiting for auth state change');
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

    const handleSuccessfulAuth = async (session: Session) => {
      if (hasRedirected) return; // Prevent multiple redirects

      try {
        console.log('Session found in callback:', session.user.email);
        hasRedirected = true;

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

    // Timeout fallback - if nothing happens in 15 seconds, redirect to login
    const timeoutTimer = setTimeout(() => {
      if (!hasRedirected) {
        console.log('Auth callback timeout, redirecting to login');
        hasRedirected = true;
        router.push('/login?error=timeout');
      }
    }, 15000);

    return () => {
      subscription.unsubscribe();
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
