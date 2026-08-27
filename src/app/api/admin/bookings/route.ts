// src/app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const supabase = supabaseAdmin();
    let dbQuery = supabase
      .from('bookings')
      .select('*, fixed_departures(departure_date, return_date, status, price_per_person), packages(title, slug)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('booking_status', status);
    }

    if (query) {
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,booking_reference.ilike.%${query}%`);
    }

    const { data: bookings, error } = await dbQuery;
    if (error) throw error;

    // Calculate pipeline statistics
    const all = bookings || [];
    const stats = {
      total: all.length,
      pending: all.filter((b) => b.booking_status === 'pending').length,
      confirmed: all.filter((b) => b.booking_status === 'confirmed').length,
      cancelled: all.filter((b) => b.booking_status === 'cancelled').length,
    };

    return NextResponse.json({ success: true, data: all, stats });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, bookingStatus, paymentStatus, finalQuotedPrice, consultantNotes } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Fetch existing booking
    const { data: existing, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    const updatedPreferences = {
      ...(existing.preferences || {}),
      consultantNotes: consultantNotes ?? existing.preferences?.consultantNotes,
      finalQuotedPrice: finalQuotedPrice ?? existing.preferences?.finalQuotedPrice,
      quoteIssuedAt: new Date().toISOString(),
    };

    const { data: updated, error: updateErr } = await supabase
      .from('bookings')
      .update({
        booking_status: bookingStatus ?? existing.booking_status,
        payment_status: paymentStatus ?? existing.payment_status,
        preferences: updatedPreferences,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}
