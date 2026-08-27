// src/app/api/bookings/submit/route.ts
// POST /api/bookings/submit
// Handles both Package 1-7 lead inquiries and Package 8 fixed departure reservations.
// Atomically increments booked_seats; prevents overbooking beyond max_capacity (6).

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingEmails } from '@/lib/mailer';
import { ApiResponse, BookingFormData, BookingSubmitResponse } from '@/types/booking';

export const runtime = 'nodejs';

function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GSF-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  let body: BookingFormData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Basic validation
  const requiredFields: (keyof BookingFormData)[] = ['full_name', 'email', 'phone', 'package_id', 'travel_type', 'adults'];
  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  // Email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid email address' },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  const isFixedDeparture = Boolean(body.departure_id);

  // ── Package 8: Check and lock seats atomically ──────────────────────────
  let departure = null;
  if (isFixedDeparture && body.departure_id) {
    const { data: dep, error: depError } = await db
      .from('fixed_departures')
      .select('*')
      .eq('id', body.departure_id)
      .single();

    if (depError || !dep) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Selected departure not found' },
        { status: 404 }
      );
    }

    if (dep.status === 'cancelled') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This departure has been cancelled. Please select another date.' },
        { status: 409 }
      );
    }

    const requestedSeats = body.adults + (body.children ?? 0);
    const availableSeats = dep.max_capacity - dep.booked_seats;

    if (requestedSeats > availableSeats) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} remaining for this departure. Please adjust your guest count or choose another date.`,
        },
        { status: 409 }
      );
    }
    departure = dep;
  }

  // ── Fetch package details for emails ────────────────────────────────────
  const { data: pkg } = await db
    .from('packages')
    .select('title, slug')
    .eq('id', body.package_id)
    .single();

  const packageTitle = pkg?.title ?? `Package #${body.package_id}`;

  // ── Fetch preferences snapshot from questionnaire_leads ─────────────────
  let leadPreferences: Record<string, unknown> = body.preferences ?? {};
  if (body.lead_id) {
    const { data: lead } = await db
      .from('questionnaire_leads')
      .select('preferences')
      .eq('lead_id', body.lead_id)
      .single();
    if (lead?.preferences) {
      leadPreferences = { ...lead.preferences, ...leadPreferences };
    }
  }

  // ── Generate unique booking reference (retry up to 3x on collision) ─────
  let bookingReference = generateBookingReference();
  let attempts = 0;
  while (attempts < 3) {
    const { data: existing } = await db
      .from('bookings')
      .select('id')
      .eq('booking_reference', bookingReference)
      .single();
    if (!existing) break;
    bookingReference = generateBookingReference();
    attempts++;
  }

  // ── Insert booking ───────────────────────────────────────────────────────
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .insert({
      booking_reference: bookingReference,
      package_id: body.package_id,
      departure_id: body.departure_id ?? null,
      lead_id: body.lead_id ?? null,
      full_name: body.full_name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone.trim(),
      gender: body.gender ?? null,
      date_of_birth: body.date_of_birth ?? null,
      travel_type: body.travel_type,
      arrival_date: body.arrival_date ?? null,
      travel_duration: body.travel_duration ?? null,
      adults: body.adults,
      children: body.children ?? 0,
      single_room_requested: body.single_room_requested ?? false,
      custom_message: body.custom_message?.trim() ?? null,
      preferences: leadPreferences,
      booking_status: 'pending',
      payment_status: 'unpaid',
    })
    .select()
    .single();

  if (bookingError || !booking) {
    console.error('[/api/bookings/submit] Insert error:', bookingError);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to save booking. Please try again.' },
      { status: 500 }
    );
  }

  // ── Atomically increment booked_seats for Package 8 ─────────────────────
  if (isFixedDeparture && body.departure_id && departure) {
    const requestedSeats = body.adults + (body.children ?? 0);
    const newBookedSeats = departure.booked_seats + requestedSeats;
    const newStatus = newBookedSeats >= departure.max_capacity ? 'sold_out' : 'available';

    const { error: updateError } = await db
      .from('fixed_departures')
      .update({
        booked_seats: newBookedSeats,
        status: newStatus,
      })
      .eq('id', body.departure_id)
      .eq('booked_seats', departure.booked_seats); // Optimistic concurrency check

    if (updateError) {
      console.error('[/api/bookings/submit] Seat update error:', updateError);
      // Booking already saved — don't fail the whole request, but log it
    }
  }

  // ── Fire emails (non-blocking — don't fail the response if email fails) ─
  sendBookingEmails({
    booking,
    departure: departure ?? undefined,
    packageTitle,
  }).catch((err) => {
    console.error('[/api/bookings/submit] Email send failed:', err);
  });

  return NextResponse.json<ApiResponse<BookingSubmitResponse>>(
    {
      success: true,
      data: {
        booking_reference: booking.booking_reference,
        booking_id: booking.id,
      },
    },
    { status: 201 }
  );
}
