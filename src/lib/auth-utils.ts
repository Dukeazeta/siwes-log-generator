import { supabase } from './supabase';

/**
 * Checks if an error is related to invalid refresh tokens or missing sessions
 */
export function isRefreshTokenError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = (error as Error)?.message || String(error);
  return (
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('Refresh Token Not Found') ||
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('Auth session missing') ||
    errorMessage.includes('session_not_found')
  );
}

/**
 * Handles auth errors by clearing invalid sessions
 */
export async function handleAuthError(error: unknown): Promise<void> {
  if (isRefreshTokenError(error)) {
    console.warn('Auth session error detected, clearing session:', (error as Error)?.message || String(error));
    
    try {
      // Only attempt signOut if the error isn't about missing session
      const errorMessage = (error as Error)?.message || String(error);
      if (!errorMessage.includes('Auth session missing') && !errorMessage.includes('session_not_found')) {
        await supabase.auth.signOut();
      } else {
        console.log('Session already missing, skipping signOut call');
      }
      
      // Clear localStorage manually as backup
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
    } catch (signOutError) {
      console.warn('Error during auth cleanup (handled gracefully):', signOutError);
      
      // Force clear localStorage if signOut fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
    }
  }
}

/**
 * Safely gets the current session with error handling
 */
export async function getSafeSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
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
 * Safely gets the current user with error handling
 */
export async function getSafeUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
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
