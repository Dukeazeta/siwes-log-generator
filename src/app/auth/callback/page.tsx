'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);

        // Wait a moment for the URL to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the session after Supabase has processed the callback
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          router.push('/login?error=session_error');
          return;
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
          console.log('No session found, redirecting to login');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    // Start the callback handling
    handleAuthCallback();

    // Timeout fallback
    const timeoutTimer = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      router.push('/login?error=timeout');
    }, 10000);

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
