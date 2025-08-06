'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import PageTransition from "../../components/PageTransition";
import Logo from "../../components/Logo";

export default function Login() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithGoogle, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
    if (!isLoading && isAuthenticated && user) {
      console.log('Redirecting authenticated user');
      if (user.hasCompletedOnboarding) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSubmitting(true);

      await signInWithGoogle();

      // Note: Don't set isSubmitting to false here as the user will be redirected
      // The OAuth flow will handle the redirect to the callback page
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error && error.message?.includes('missing OAuth client ID')) {
        setError('Google OAuth is not configured yet. Please try again later.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center px-4 py-8 md:px-6 transition-colors duration-300">
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="flex items-center space-x-2 !text-black dark:!text-gray-300 hover:!text-gray-800 dark:hover:!text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

        {/* Login Container */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8 sm:mb-12">
            <Link href="/" className="inline-block mb-6 sm:mb-8">
              <Logo
                width={64}
                height={64}
                className="w-16 h-16 mx-auto"
              />
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to continue to SwiftLog
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {error}
              </p>
            </div>
          )}

          {/* Google Login Button */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-4 !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base rounded-full focus:outline-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 mr-3 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                  <span className="font-semibold">Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-semibold">Continue with Google</span>
                </>
              )}
            </button>
          </div>
          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
