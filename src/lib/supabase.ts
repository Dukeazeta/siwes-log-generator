import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
    // Mobile-friendly settings
    debug: process.env.NODE_ENV === 'development'
  },
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'swiftlog-web'
    }
  }
})

// Add global error handler for auth errors
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' && !session) {
      // Clear any remaining auth data from localStorage
      localStorage.removeItem('sb-auth-token');
    }
  });
}
