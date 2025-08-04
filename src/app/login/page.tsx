'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import PageTransition from "../../components/PageTransition";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signInWithGoogle, isAuthenticated, isLoading, user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      console.log('Login successful, waiting for auth state change...');
      // Router push will be handled by the auth state change in useEffect
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSubmitting(true);

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      await signInWithGoogle();

      // Note: Don't set isSubmitting to false here as the user will be redirected
      // The OAuth flow will handle the redirect to the callback page
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error && error.message?.includes('missing OAuth client ID')) {
        setError('Google OAuth is not configured yet. Please use email/password for now.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 md:px-6">
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

      {/* Login Container */}
      <div className="login-container relative z-10 w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-12">
          <Link href="/" className="inline-block mb-6 sm:mb-8">
            <Image
              src="/LOGOS/SwiftLog.svg"
              alt="SwiftLog Logo"
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 text-base">
            Sign in to continue to SwiftLog
          </p>
        </div>

        {/* Login Form */}
        <div className="login-form">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="form-field">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}
            {/* Email Field */}
            <div className="form-field">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 transition-colors duration-200"
                placeholder="Email address"
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-field">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-0 py-4 pr-10 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 transition-colors duration-200"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="form-field text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-field w-full bg-gray-900 text-white py-4 font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full focus:outline-none"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="form-field relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="form-field w-full flex items-center justify-center px-4 py-3 sm:py-4 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-base sm:text-sm rounded-full focus:outline-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="font-semibold text-gray-700">Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-semibold text-gray-700">Continue with Google</span>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="form-field text-center mt-6 sm:mt-8 pb-4">
            <p className="text-base text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-gray-900 font-semibold hover:underline transition-all"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
