// src/lib/supabase.ts
// Supabase client helpers — server-side (service_role) and client-side (anon).
// All validation is lazy (inside factory functions) so the build can succeed
// without env vars present at static analysis time.

import { createClient } from '@supabase/supabase-js';

/**
 * Public (anon) client — safe for client components.
 * Read-only access to packages and fixed_departures (RLS enforced).
 */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return createClient(url, key);
}


/**
 * Server-side (service_role) client — ONLY use inside API routes / Server Actions.
 * Full DB access — never expose to the browser.
 */
export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This client must only be used server-side.'
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
