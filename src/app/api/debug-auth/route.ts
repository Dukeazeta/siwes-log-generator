import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    // Get auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Get cookies
    const cookies = request.cookies.getAll();

    // Create a Supabase client to test token validity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let user = null;
    let tokenError = null;

    if (token) {
      const { data: { user: userData }, error } = await supabase.auth.getUser(token);
      user = userData;
      tokenError = error;
    }

    return NextResponse.json({
      middleware: {
        userId,
        userEmail,
      },
      auth: {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        tokenError: tokenError?.message,
        user: user ? {
          id: user.id,
          email: user.email,
        } : null,
      },
      cookies: cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value.substring(0, 20) + '...',
        hasValue: !!cookie.value,
      })),
      headers: {
        authHeader: authHeader ? 'Bearer ' + authHeader.substring(0, 20) + '...' : null,
        cookieHeader: request.headers.get('cookie')?.substring(0, 100) + '...',
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}