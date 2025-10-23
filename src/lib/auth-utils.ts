import { authLockManager, withAuthLock } from "./auth/auth-lock";
import { supabase } from "./supabase";

/**
 * Checks if an error is related to invalid refresh tokens or missing sessions
 */
export function isRefreshTokenError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = (error as Error)?.message || String(error);
  return (
    errorMessage.includes("refresh_token_not_found") ||
    errorMessage.includes("Invalid Refresh Token") ||
    errorMessage.includes("Refresh Token Not Found") ||
    errorMessage.includes("invalid_grant") ||
    errorMessage.includes("Auth session missing") ||
    errorMessage.includes("session_not_found")
  );
}

/**
 * Handles auth errors by clearing invalid sessions
 * Now uses lock manager to prevent race conditions
 */
export async function handleAuthError(error: unknown): Promise<void> {
  if (!isRefreshTokenError(error)) {
    return;
  }

  // Use lock manager to prevent concurrent auth error handling
  try {
    await withAuthLock(
      "logout",
      async (transitionId) => {
        console.warn(
          `Auth session error detected (transition: ${transitionId}), clearing session:`,
          (error as Error)?.message || String(error),
        );

        const errorMessage = (error as Error)?.message || String(error);

        // Only attempt signOut if the error isn't about missing session
        if (
          !errorMessage.includes("Auth session missing") &&
          !errorMessage.includes("session_not_found")
        ) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.warn("Error during signOut (handled gracefully):", signOutError);
          }
        } else {
          console.log("Session already missing, skipping signOut call");
        }

        // Clear localStorage manually as backup
        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase.auth.token");
        }
      },
      { waitForLock: false }, // Don't wait if another operation is in progress
    );
  } catch (lockError) {
    // If we can't get a lock, still try to clear localStorage
    console.warn("Could not acquire auth lock for error handling:", lockError);

    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase.auth.token");
    }
  }
}

/**
 * Safely gets the current session with error handling and lock management
 */
export async function getSafeSession() {
  // Check if we can perform this operation
  const currentTransition = authLockManager.getCurrentTransition();

  // Allow session checks unless we're in the middle of logout
  if (currentTransition?.operation === "logout") {
    console.log("Session check blocked during logout operation");
    return { session: null, error: new Error("Logout in progress") };
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      await handleAuthError(error);
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    await handleAuthError(error);
    return { session: null, error };
  }
}

/**
 * Safely gets the current user with error handling and lock management
 */
export async function getSafeUser() {
  // Check if we can perform this operation
  const currentTransition = authLockManager.getCurrentTransition();

  // Allow user checks unless we're in the middle of logout
  if (currentTransition?.operation === "logout") {
    console.log("User check blocked during logout operation");
    return { user: null, error: new Error("Logout in progress") };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      await handleAuthError(error);
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    await handleAuthError(error);
    return { user: null, error };
  }
}

/**
 * Refresh the session with lock management
 */
export async function refreshSession() {
  return withAuthLock(
    "refresh",
    async (transitionId) => {
      console.log(`Refreshing session (transition: ${transitionId})`);

      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);
        await handleAuthError(error);
        return { session: null, error };
      }

      return { session, error: null };
    },
    { waitForLock: true, maxWaitTime: 5000 },
  );
}

/**
 * Validates current auth state
 */
export async function validateAuthState(): Promise<{
  isValid: boolean;
  needsRefresh: boolean;
  error?: Error;
}> {
  try {
    const { session, error } = await getSafeSession();

    if (error || !session) {
      return {
        isValid: false,
        needsRefresh: false,
        error: error instanceof Error ? error : new Error("No session found"),
      };
    }

    // Check if token needs refresh (expires in less than 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresIn = expiresAt * 1000 - Date.now();
      const needsRefresh = expiresIn < 5 * 60 * 1000; // 5 minutes

      return {
        isValid: true,
        needsRefresh,
      };
    }

    return {
      isValid: true,
      needsRefresh: false,
    };
  } catch (error) {
    return {
      isValid: false,
      needsRefresh: false,
      error: error instanceof Error ? error : new Error("Auth validation failed"),
    };
  }
}

/**
 * Sets up automatic session refresh with lock management
 */
export function setupAutoRefresh(
  onRefresh?: (success: boolean) => void,
  intervalMs: number = 4 * 60 * 1000, // 4 minutes
): () => void {
  let intervalId: NodeJS.Timeout | null = null;

  const checkAndRefresh = async () => {
    const state = await validateAuthState();

    if (state.needsRefresh && state.isValid) {
      try {
        const { session, error } = await refreshSession();
        onRefresh?.(!!session && !error);
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        onRefresh?.(false);
      }
    }
  };

  // Initial check
  checkAndRefresh();

  // Set up interval
  const interval = setInterval(checkAndRefresh, intervalMs);
  intervalId = interval;

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

/**
 * Utility to wait for any ongoing auth operations to complete
 */
export async function waitForAuthOperations(maxWaitTime: number = 10000): Promise<boolean> {
  const startTime = Date.now();

  while (authLockManager.isAnyOperationInProgress()) {
    if (Date.now() - startTime > maxWaitTime) {
      console.warn("Timeout waiting for auth operations to complete");
      return false;
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return true;
}

/**
 * Gets auth debug info for troubleshooting
 */
export function getAuthDebugInfo() {
  const currentTransition = authLockManager.getCurrentTransition();
  const history = authLockManager.getTransitionHistory();

  return {
    currentOperation: currentTransition?.operation || "none",
    operationInProgress: authLockManager.isAnyOperationInProgress(),
    transitionId: currentTransition?.id,
    elapsedTime: authLockManager.getCurrentTransitionElapsedTime(),
    recentHistory: history.slice(-5).map((t) => ({
      operation: t.operation,
      status: t.status,
      timestamp: new Date(t.timestamp).toISOString(),
    })),
  };
}
