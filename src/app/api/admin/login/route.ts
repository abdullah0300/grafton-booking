// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySecretKey, generateAdminToken, ADMIN_COOKIE_NAME, DEFAULT_SECRET_KEY } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secretKey } = body;

    if (!secretKey || !verifySecretKey(secretKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin secret passkey.' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(DEFAULT_SECRET_KEY);
    const response = NextResponse.json({ success: true, message: 'Authenticated successfully.' });

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error.' },
      { status: 500 }
    );
  }
}
