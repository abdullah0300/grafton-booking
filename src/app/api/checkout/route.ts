// src/app/api/checkout/route.ts
// POST /api/checkout
// Pluggable payment gateway stub — ready for Stripe, DPO, or Pesapal integration.
// Currently creates a payment record and returns a placeholder response.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types/booking';

export const runtime = 'nodejs';

interface CheckoutRequest {
  booking_id: string;
  gateway: 'stripe' | 'dpo' | 'pesapal' | 'manual';
  amount: number;
  currency?: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.booking_id || !body.gateway || !body.amount) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Missing required fields: booking_id, gateway, amount' },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  // Verify the booking exists
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select('id, booking_reference, payment_status')
    .eq('id', body.booking_id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Create a pending payment record
  const { data: payment, error: paymentError } = await db
    .from('payments')
    .insert({
      booking_id: body.booking_id,
      gateway: body.gateway,
      transaction_reference: null, // To be updated by gateway webhook
      amount: body.amount,
      currency: body.currency ?? 'USD',
      status: 'pending',
    })
    .select()
    .single();

  if (paymentError || !payment) {
    console.error('[/api/checkout] Payment insert error:', paymentError);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to initiate payment record' },
      { status: 500 }
    );
  }

  // ─── Gateway-specific integration points (pluggable) ─────────────────────
  // 
  // STRIPE:
  //   const session = await stripe.checkout.sessions.create({ ... });
  //   return NextResponse.json({ success: true, data: { redirect_url: session.url } });
  //
  // DPO PAY:
  //   const token = await dpo.createToken({ ... });
  //   return NextResponse.json({ success: true, data: { redirect_url: `https://pay.dpo.co.ke/${token}` } });
  //
  // PESAPAL:
  //   const order = await pesapal.submitOrder({ ... });
  //   return NextResponse.json({ success: true, data: { redirect_url: order.redirect_url } });
  //
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      payment_id: payment.id,
      booking_reference: booking.booking_reference,
      gateway: body.gateway,
      amount: body.amount,
      currency: body.currency ?? 'USD',
      status: 'pending',
      message: `Payment initiated via ${body.gateway}. Gateway integration pending configuration.`,
    },
  });
}
