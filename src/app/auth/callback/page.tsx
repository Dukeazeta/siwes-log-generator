"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "../../../components/Logo";
import { useAuth } from "../../../contexts/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refreshProfile } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState("Completing sign in...");
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [showRetryOption, setShowRetryOption] = useState(false);

  useEffect(() => {
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // Let Supabase handle the OAuth callback automatically
    // The AuthContext will detect the auth state change and update the user
    console.log("OAuth callback page loaded, letting Supabase handle authentication...");
  }, [router]);

  // Wait for auth state to be determined
  useEffect(() => {
    console.log("Auth callback state check:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      onboardingStatus: user?.hasCompletedOnboarding,
    });

    if (isLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    if (isAuthenticated && user) {
      console.log("User authenticated successfully:", user.email);

      // Always redirect to dashboard first - let dashboard handle onboarding check
      // This prevents race conditions where profile check failed in AuthContext
      console.log("Redirecting to dashboard, will check onboarding status there");
      router.push("/dashboard");
    } else if (!isLoading) {
      // Only redirect to login if we're not loading and definitely not authenticated
      console.log("No authenticated user after loading complete, redirecting to login");
      router.push("/login?error=no_session");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Progressive loading messages
  useEffect(() => {
    const progressTimers = [
      setTimeout(() => setLoadingMessage("Setting up your profile..."), 3000),
      setTimeout(() => setLoadingMessage("Almost ready..."), 8000),
      setTimeout(() => setLoadingMessage("Taking longer than expected..."), 15000),
      setTimeout(() => {
        setLoadingMessage("Having trouble? You can try refreshing.");
        setShowRetryOption(true);
      }, 20000),
    ];

    return () => {
      progressTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Reduced timeout with retry option
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (isLoading && !showRetryOption) {
        console.log("Auth callback timeout while still loading, showing retry option");
        setShowRetryOption(true);
        setLoadingMessage("Authentication is taking longer than expected.");
      }
    }, 20000); // Reduced to 20 seconds

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [isLoading, showRetryOption]);

  // Final timeout - redirect to login after 30 seconds
  useEffect(() => {
    const finalTimeoutTimer = setTimeout(() => {
      if (isLoading) {
        console.log("Final auth callback timeout, redirecting to login");
        router.push("/login?error=timeout");
      }
    }, 30000); // Reduced to 30 seconds

    return () => {
      clearTimeout(finalTimeoutTimer);
    };
  }, [isLoading, router]);

  // Handle manual retry
  const handleRetry = async () => {
    try {
      setRetryAttempts((prev) => prev + 1);
      setShowRetryOption(false);
      setLoadingMessage("Retrying authentication...");

      // Try to refresh user context with shorter timeout
      if (refreshProfile) {
        const refreshPromise = refreshProfile();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Refresh timeout")), 10000),
        );

        try {
          await Promise.race([refreshPromise, timeoutPromise]);
        } catch (error) {
          console.warn("Refresh timed out or failed:", error);
        }
      }

      // Check auth state after a short delay
      setTimeout(() => {
        if (!isAuthenticated) {
          console.log("Still not authenticated after retry, redirecting to signup");
          router.push("/signup?error=retry_failed");
        }
      }, 3000); // Reduced from 10 seconds to 3 seconds
    } catch (error) {
      console.error("Retry failed:", error);
      router.push("/signup?error=retry_failed");
    }
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background transition-colors duration-300">
      <div className="text-center max-w-md mx-auto px-4">
        <Logo width={64} height={64} className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-foreground mb-2">{loadingMessage}</p>
        <p className="text-muted-foreground text-sm mb-6">
          {showRetryOption
            ? "Please wait or try one of the options below."
            : "This may take a few seconds"}
        </p>

        {showRetryOption && (
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={retryAttempts >= 2}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {retryAttempts >= 2
                ? "Max retries reached"
                : `Try Again${retryAttempts > 0 ? ` (${retryAttempts}/2)` : ""}`}
            </button>
            <button
              onClick={handleManualRefresh}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Back to Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
