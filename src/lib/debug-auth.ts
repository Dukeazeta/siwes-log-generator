/**
 * Authentication debugging utilities
 */

export interface AuthDebugInfo {
  timestamp: string;
  environment: string;
  supabaseConfigured: boolean;
  sessionExists: boolean;
  sessionData: any;
  cookies: string[];
  headers: Record<string, string>;
  errors: string[];
}

export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  const debugInfo: AuthDebugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    sessionExists: false,
    sessionData: null,
    cookies: [],
    headers: {},
    errors: [],
  };

  try {
    // Check if we're in browser
    if (typeof window !== 'undefined') {
      // Get cookies
      debugInfo.cookies = document.cookie.split(';').map(c => c.trim());

      // Get local storage
      const accessToken = localStorage.getItem('supabase.auth.token');
      if (accessToken) {
        debugInfo.headers['authorization'] = `Bearer ${JSON.parse(accessToken)?.access_token}`;
      }
    }

    // Try to get session
    const { supabase } = await import('./supabase');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      debugInfo.errors.push(`Session error: ${error.message}`);
    } else if (session) {
      debugInfo.sessionExists = true;
      debugInfo.sessionData = {
        user_id: session.user?.id,
        email: session.user?.email,
        created_at: session.user?.created_at,
        expires_at: session.expires_at,
        access_token_present: !!session.access_token,
        refresh_token_present: !!session.refresh_token,
      };
    } else {
      debugInfo.errors.push('No session found');
    }
  } catch (error) {
    debugInfo.errors.push(`Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return debugInfo;
}

export function logAuthDebugInfo(context: string = 'Auth Debug'): void {
  getAuthDebugInfo().then(debugInfo => {
    console.group(`🔍 ${context}`);
    console.log('Timestamp:', debugInfo.timestamp);
    console.log('Environment:', debugInfo.environment);
    console.log('Supabase Configured:', debugInfo.supabaseConfigured);
    console.log('Session Exists:', debugInfo.sessionExists);

    if (debugInfo.sessionData) {
      console.log('Session Data:', debugInfo.sessionData);
    }

    if (debugInfo.cookies.length > 0) {
      console.log('Cookies:', debugInfo.cookies);
    }

    if (debugInfo.errors.length > 0) {
      console.error('Errors:', debugInfo.errors);
    }

    console.groupEnd();
  });
}

export function createApiTestUrl(endpoint: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || '';

  return `${baseUrl}/api${endpoint}`;
}

export async function testApiEndpoint(endpoint: string): Promise<{
  url: string;
  status: number;
  statusText: string;
  contentType: string;
  isAuthenticated: boolean;
  error?: string;
}> {
  const url = createApiTestUrl(endpoint);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isAuthenticated = response.status !== 401;

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      contentType,
      isAuthenticated,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      statusText: 'Network Error',
      contentType: '',
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown network error',
    };
  }
}

// Export a utility function to quickly test API connectivity
export async function runApiConnectivityTest(): Promise<void> {
  console.group('🌐 API Connectivity Test');

  const endpoints = [
    '/generate-log-unified',
    '/send-weekly-summary',
    '/ocr/extract',
  ];

  for (const endpoint of endpoints) {
    const test = await testApiEndpoint(endpoint);
    console.log(`${endpoint}:`, {
      status: `${test.status} ${test.statusText}`,
      contentType: test.contentType,
      authenticated: test.isAuthenticated,
      error: test.error,
    });
  }

  console.groupEnd();
}