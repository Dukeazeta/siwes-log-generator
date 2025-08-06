import { supabase } from './supabase';

/**
 * Checks if an error is related to invalid refresh tokens
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  return (
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('Refresh Token Not Found') ||
    errorMessage.includes('invalid_grant')
  );
}

/**
 * Handles auth errors by clearing invalid sessions
 */
export async function handleAuthError(error: any): Promise<void> {
  if (isRefreshTokenError(error)) {
    console.warn('Refresh token error detected, clearing session:', error.message);
    
    try {
      // Sign out to clear invalid session
      await supabase.auth.signOut();
      
      // Clear localStorage manually as backup
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
    } catch (signOutError) {
      console.error('Error during auth cleanup:', signOutError);
      
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
