// src/app/api/customer/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const ref = searchParams.get('ref')?.trim().toUpperCase();

    if (!email && !ref) {
      return NextResponse.json(
        { success: false, error: 'Please provide an email address or booking reference.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    let query = supabase
      .from('bookings')
      .select('id, booking_reference, package_id, travel_type, arrival_date, travel_duration, adults, children, single_room_requested, preferences, booking_status, payment_status, created_at, fixed_departures(departure_date, return_date, status, price_per_person), packages(id, title, slug, duration, indicative_price, is_fixed_departure)')
      .order('created_at', { ascending: false });

    if (ref) {
      query = query.eq('booking_reference', ref);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: bookings || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}
