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

  // Get auth token from cookies
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    const match = document.cookie.match(/(^|;)sb-access-token=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : null;
  },

  // Clear auth cookies
  clearAuthCookies() {
    if (typeof window === 'undefined') return;

    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
  }
};