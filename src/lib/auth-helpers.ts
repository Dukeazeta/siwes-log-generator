import { Session } from '@supabase/supabase-js';

export const authHelpers = {
  // Set auth cookies
  setAuthCookies(session: Session | null) {
    if (typeof window === 'undefined') return;

    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax;`;
      document.cookie = `sb-refresh-token=${session.refresh_token || ''}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax;`;
    } else {
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    }
  },

  // Get auth token from cookies or localStorage
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    // First try cookies (for middleware/API calls)
    const cookieMatch = document.cookie.match(/(^|;)sb-access-token=([^;]*)/);
    if (cookieMatch) {
      return decodeURIComponent(cookieMatch[2]);
    }

    // Fallback to localStorage (for Supabase client)
    try {
      const storageKey = 'supabase.auth.token';
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return parsed.currentSession?.access_token || null;
      }
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error);
    }

    return null;
  },

  // Clear auth cookies and localStorage
  clearAuthCookies() {
    if (typeof window === 'undefined') return;

    // Clear cookies
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';

    // Clear localStorage
    try {
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};