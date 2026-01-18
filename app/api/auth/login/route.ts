import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get credentials from server-side environment variables (not NEXT_PUBLIC_)
    const AUTH_USERNAME = process.env.AUTH_USERNAME || 'hannie';
    const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'wishlist2026';

    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      // Create a simple session token (in production, use proper JWT or session management)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      const response = NextResponse.json({ success: true });
      
      // Set HTTP-only cookie (secure, not accessible via JavaScript)
      response.cookies.set('wishlist-auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
