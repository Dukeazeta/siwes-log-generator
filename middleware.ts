import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip authentication for certain public endpoints
  const publicEndpoints = [
    '/api/sentry-example-api',
    '/api/debug-auth',
  ];

  if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    return NextResponse.next();
  }

  try {
    // Get the auth token from the request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      // For client-side requests, check for session cookie
      const accessToken = request.cookies.get('sb-access-token')?.value ||
                          request.cookies.get('sb-auth-token')?.value;

      if (!accessToken) {
        console.error('No authentication token found for:', request.nextUrl.pathname);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Validate the session token
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        console.error('Invalid session token:', error);
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        );
      }

      // Add user info to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');

      return response;
    }

    // For Bearer token authentication
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Invalid auth token:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Add user info to request headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};