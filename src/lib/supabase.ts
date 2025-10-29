import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    // Mobile-friendly settings
    debug: process.env.NODE_ENV === 'development'
  },
  // Global configuration with proper headers to avoid 406 errors
  global: {
    headers: {
      'X-Client-Info': 'swiftlog-web',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  // Add custom fetch to ensure proper headers
  db: {
    schema: 'public'
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
