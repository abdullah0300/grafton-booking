// src/lib/adminAuth.ts
// Secret authentication helper for Grafton Safaris Admin / Consultant Portal

import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'gs_admin_session_v1';
const DEFAULT_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'grafton-safari-admin-2027';

/**
 * Generate HMAC token for the admin session
 */
export function generateAdminToken(secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update('grafton_admin_authenticated').digest('hex');
}

/**
 * Verify secret key against configured admin secret
 */
export function verifySecretKey(inputSecret: string): boolean {
  if (!inputSecret) return false;
  return inputSecret.trim() === DEFAULT_SECRET_KEY.trim();
}

/**
 * Check if the current incoming request has a valid admin session cookie
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!sessionCookie) return false;

    const expectedToken = generateAdminToken(DEFAULT_SECRET_KEY);
    return sessionCookie === expectedToken;
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE_NAME, DEFAULT_SECRET_KEY };
