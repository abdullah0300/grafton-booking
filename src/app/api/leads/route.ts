// src/app/api/leads/route.ts
// GET /api/leads?leadId=<lead_id>
// Server-side lookup — returns pre-fill data for a given leadId.
// Never exposes the raw questionnaire_leads row; strips internal fields.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse, LeadPrefillResponse } from '@/types/booking';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');

  if (!leadId || leadId.trim() === '') {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'leadId parameter is required' },
      { status: 400 }
    );
  }

  // Sanitize: only allow alphanumeric + underscore/hyphen
  if (!/^[a-zA-Z0-9_-]{1,60}$/.test(leadId)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid leadId format' },
      { status: 400 }
    );
  }

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('questionnaire_leads')
      .select('full_name, email, phone, arrival_date, duration, adults, children, preferences')
      .eq('lead_id', leadId)
      .single();

    if (error || !data) {
      // Return empty success (not 404) — caller falls back to standalone mode
      return NextResponse.json<ApiResponse<LeadPrefillResponse>>(
        { success: true, data: {} },
        { status: 200 }
      );
    }

    const prefill: LeadPrefillResponse = {
      full_name: data.full_name ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      arrival_date: data.arrival_date ?? undefined,
      duration: data.duration ?? undefined,
      adults: data.adults,
      children: data.children,
      preferences: data.preferences ?? {},
    };

    return NextResponse.json<ApiResponse<LeadPrefillResponse>>(
      { success: true, data: prefill },
      { status: 200 }
    );
  } catch (err) {
    console.error('[/api/leads] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
