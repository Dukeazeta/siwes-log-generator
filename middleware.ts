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
    // Get the auth token from the request headers (case-insensitive)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('Middleware: Checking authentication for:', request.nextUrl.pathname, {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : null
  });

    if (!token) {
      // For client-side requests, check for session cookie
      const accessToken = request.cookies.get('sb-access-token')?.value ||
                          request.cookies.get('sb-auth-token')?.value;

      console.log('Middleware: No Authorization header, checking cookies:', {
        hasAccessToken: !!accessToken,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      });

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
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-email', user.email || '');

      console.log('Middleware: Set headers for user (cookie auth):', {
        userId: user.id,
        userEmail: user.email,
        requestHeaders: {
          'x-user-id': user.id,
          'x-user-email': user.email || ''
        }
      });

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');

    console.log('Middleware: Set headers for user:', {
      userId: user.id,
      userEmail: user.email,
      requestHeaders: {
        'x-user-id': user.id,
        'x-user-email': user.email || ''
      }
    });

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

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