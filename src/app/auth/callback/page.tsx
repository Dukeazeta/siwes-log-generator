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
        
        // Get the session from the URL hash or query params
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('Session found in callback:', data.session.user.email);
          
          // Check if user has completed onboarding
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('completed_onboarding')
            .eq('user_id', data.session.user.id)
            .single();

          if (profileData?.completed_onboarding) {
            console.log('Redirecting to dashboard');
            router.push('/dashboard');
          } else {
            console.log('Redirecting to onboarding');
            router.push('/onboarding');
          }
        } else {
          console.log('No session found, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    // Small delay to ensure URL params are available
    const timer = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
