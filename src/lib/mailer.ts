// src/lib/mailer.ts
// Transactional email dispatch using Resend API
// Sends notification to gstt@graftonsafaris.com and confirmation to traveler

import { Resend } from 'resend';
import { Booking, FixedDeparture } from '@/types/booking';

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'bookings@graftonsafaris.com';
const ADMIN_EMAIL = 'gstt@graftonsafaris.com';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY environment variable.');
  return new Resend(key);
}


interface EmailPayload {
  booking: Booking;
  departure?: FixedDeparture;
  packageTitle: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function generateAdminEmailHtml({ booking, departure, packageTitle }: EmailPayload): string {
  const singleRoomNote = booking.single_room_requested
    ? `<p><strong>Single Room Supplement:</strong> Requested</p>`
    : '';
  const departureSection = departure
    ? `
      <p><strong>Departure Date:</strong> ${formatDate(departure.departure_date)}</p>
      <p><strong>Return Date:</strong> ${formatDate(departure.return_date)}</p>
      <p><strong>Price per Person:</strong> $${departure.price_per_person.toFixed(2)}</p>
      ${booking.single_room_requested ? `<p><strong>Single Supplement:</strong> $${departure.single_supplement_price.toFixed(2)}</p>` : ''}
    `
    : `<p><strong>Preferred Arrival:</strong> ${formatDate(booking.arrival_date)}</p>
       <p><strong>Duration:</strong> ${booking.travel_duration ?? 'TBD'}</p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><style>
      body { font-family: Georgia, serif; color: #2d2d2d; background: #f9f7f2; margin: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
      .header { background: #1a3a2a; color: #d4af6b; padding: 32px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
      .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
      .body { padding: 32px; }
      .section { margin-bottom: 24px; border-bottom: 1px solid #e8e0d4; padding-bottom: 20px; }
      .section:last-child { border-bottom: none; }
      h2 { color: #1a3a2a; font-size: 16px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      p { margin: 6px 0; font-size: 15px; line-height: 1.6; }
      strong { color: #1a3a2a; }
      .ref-badge { background: #1a3a2a; color: #d4af6b; padding: 8px 16px; border-radius: 4px; font-size: 18px; font-family: monospace; display: inline-block; margin-top: 8px; }
      .footer { background: #f0ebe2; padding: 20px 32px; font-size: 13px; color: #6b6b6b; text-align: center; }
    </style></head>
    <body>
    <div class="container">
      <div class="header">
        <h1>🦁 New Booking Inquiry</h1>
        <p>Grafton Safaris & Travel Management</p>
      </div>
      <div class="body">
        <div class="section">
          <h2>Booking Reference</h2>
          <div class="ref-badge">${booking.booking_reference}</div>
        </div>
        <div class="section">
          <h2>Guest Details</h2>
          <p><strong>Name:</strong> ${booking.full_name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          ${booking.gender ? `<p><strong>Gender:</strong> ${booking.gender}</p>` : ''}
          ${booking.date_of_birth ? `<p><strong>Date of Birth:</strong> ${formatDate(booking.date_of_birth)}</p>` : ''}
        </div>
        <div class="section">
          <h2>Safari Details</h2>
          <p><strong>Package:</strong> ${packageTitle}</p>
          <p><strong>Adults:</strong> ${booking.adults}</p>
          <p><strong>Children:</strong> ${booking.children}</p>
          ${singleRoomNote}
          ${departureSection}
        </div>
        ${booking.custom_message ? `
        <div class="section">
          <h2>Message from Guest</h2>
          <p>${booking.custom_message}</p>
        </div>` : ''}
      </div>
      <div class="footer">
        <p>Submitted: ${new Date(booking.created_at).toUTCString()}</p>
        <p>Grafton Safaris & Travel Management Ltd — gstt@graftonsafaris.com</p>
      </div>
    </div>
    </body></html>
  `;
}

function generateTravelerEmailHtml({ booking, departure, packageTitle }: EmailPayload): string {
  const departureSection = departure
    ? `<p><strong>Departure:</strong> ${formatDate(departure.departure_date)}</p>
       <p><strong>Return:</strong> ${formatDate(departure.return_date)}</p>`
    : `<p><strong>Preferred Arrival:</strong> ${formatDate(booking.arrival_date)}</p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><style>
      body { font-family: Georgia, serif; color: #2d2d2d; background: #f9f7f2; margin: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
      .header { background: #1a3a2a; color: #d4af6b; padding: 32px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
      .header p { margin: 8px 0 0; opacity: 0.8; }
      .body { padding: 32px; }
      p { margin: 8px 0; font-size: 15px; line-height: 1.7; }
      strong { color: #1a3a2a; }
      .ref-box { background: #f0ebe2; border-left: 4px solid #d4af6b; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0; }
      .ref-box h2 { margin: 0 0 8px; color: #1a3a2a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
      .ref-box .ref { font-size: 22px; font-family: monospace; color: #1a3a2a; font-weight: bold; }
      .footer { background: #f0ebe2; padding: 24px 32px; font-size: 13px; color: #6b6b6b; text-align: center; }
      .footer a { color: #1a3a2a; }
    </style></head>
    <body>
    <div class="container">
      <div class="header">
        <h1>Your Safari Journey Begins Here 🌍</h1>
        <p>Grafton Safaris & Travel Management</p>
      </div>
      <div class="body">
        <p>Dear ${booking.full_name.split(' ')[0]},</p>
        <p>Thank you for your booking inquiry with Grafton Safaris. We have received your request and our team will be in touch within 24–48 hours to finalise your arrangements.</p>
        <div class="ref-box">
          <h2>Your Booking Reference</h2>
          <div class="ref">${booking.booking_reference}</div>
        </div>
        <p><strong>Package:</strong> ${packageTitle}</p>
        ${departureSection}
        <p><strong>Guests:</strong> ${booking.adults} adult(s)${booking.children > 0 ? `, ${booking.children} child(ren)` : ''}</p>
        ${booking.single_room_requested ? `<p><strong>Single Room Supplement:</strong> Requested ✓</p>` : ''}
        <br>
        <p>If you have any urgent queries, please contact us directly at <a href="mailto:gstt@graftonsafaris.com">gstt@graftonsafaris.com</a>.</p>
        <p>We look forward to curating an unforgettable safari experience for you.</p>
        <br>
        <p>Warm regards,<br><strong>The Grafton Safaris Team</strong></p>
      </div>
      <div class="footer">
        <p><a href="https://graftonsafaris.com">graftonsafaris.com</a> · gstt@graftonsafaris.com</p>
        <p style="margin-top:8px; font-size:11px; color:#999;">Reference: ${booking.booking_reference} — Please keep this for your records.</p>
      </div>
    </div>
    </body></html>
  `;
}

export async function sendBookingEmails(payload: EmailPayload): Promise<void> {
  const { booking } = payload;
  const resend = getResend();

  const [adminResult, travelerResult] = await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `[New Booking] ${payload.packageTitle} — Ref: ${booking.booking_reference}`,
      html: generateAdminEmailHtml(payload),
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: [booking.email],
      subject: `Your Grafton Safaris Booking — Ref: ${booking.booking_reference}`,
      html: generateTravelerEmailHtml(payload),
    }),
  ]);

  if (adminResult.status === 'rejected') {
    console.error('[Mailer] Failed to send admin notification:', adminResult.reason);
  }
  if (travelerResult.status === 'rejected') {
    console.error('[Mailer] Failed to send traveler confirmation:', travelerResult.reason);
  }
}
