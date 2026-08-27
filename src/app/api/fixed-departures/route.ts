// src/app/api/fixed-departures/route.ts
// GET /api/fixed-departures?packageId=8
// Returns upcoming non-cancelled departures with live seat availability

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { ApiResponse, FixedDeparture } from '@/types/booking';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const packageIdStr = searchParams.get('packageId');

  if (!packageIdStr) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'packageId is required' },
      { status: 400 }
    );
  }

  const packageId = parseInt(packageIdStr, 10);
  if (isNaN(packageId)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'packageId must be a number' },
      { status: 400 }
    );
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await getSupabaseClient()
      .from('fixed_departures')
      .select('*')
      .eq('package_id', packageId)
      .neq('status', 'cancelled')
      .gte('departure_date', today)
      .order('departure_date', { ascending: true });

    if (error) {
      console.error('[/api/fixed-departures] Supabase error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch departures' },
        { status: 500 }
      );
    }

    // Compute available_seats and update status dynamically
    const departures: FixedDeparture[] = (data ?? []).map((row) => ({
      ...row,
      available_seats: Math.max(0, row.max_capacity - row.booked_seats),
      status: row.booked_seats >= row.max_capacity ? 'sold_out' : row.status,
    }));

    return NextResponse.json<ApiResponse<FixedDeparture[]>>(
      { success: true, data: departures },
      {
        status: 200,
        headers: {
          // Allow short CDN cache since seat counts change
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[/api/fixed-departures] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
