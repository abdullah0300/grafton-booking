// src/app/api/admin/departures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const { data: departures, error } = await supabase
      .from('fixed_departures')
      .select('*')
      .order('departure_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: departures || [] });
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
    const { departureId, bookedSeats, status, pricePerPerson, singleSupplementPrice } = body;

    if (!departureId) {
      return NextResponse.json({ success: false, error: 'Missing departureId.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: updated, error } = await supabase
      .from('fixed_departures')
      .update({
        booked_seats: bookedSeats !== undefined ? bookedSeats : undefined,
        status: status !== undefined ? status : undefined,
        price_per_person: pricePerPerson !== undefined ? pricePerPerson : undefined,
        single_supplement_price: singleSupplementPrice !== undefined ? singleSupplementPrice : undefined,
      })
      .eq('id', departureId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error.' }, { status: 500 });
  }
}
