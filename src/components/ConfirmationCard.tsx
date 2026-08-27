'use client';
// src/components/ConfirmationCard.tsx
// Post-submission success state.
// Fires postMessage to parent window (for iframe modal integration).

import { useEffect, useRef } from 'react';

interface ConfirmationCardProps {
  bookingReference: string;
  guestName: string;
  packageTitle: string;
  departureDate?: string;
  onClose?: () => void;
}

export default function ConfirmationCard({
  bookingReference,
  guestName,
  packageTitle,
  departureDate,
  onClose,
}: ConfirmationCardProps) {
  const messageSent = useRef(false);

  useEffect(() => {
    // Fire postMessage to parent window — used by the iframe modal in the main site.
    // Parent should listen: window.addEventListener('message', handler)
    // and close the modal on { type: 'GRAFTON_BOOKING_COMPLETE' }
    if (!messageSent.current && typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'GRAFTON_BOOKING_COMPLETE',
          data: {
            bookingReference,
            guestName,
            packageTitle,
            departureDate: departureDate ?? null,
          },
        },
        '*' // In production, replace '*' with 'https://grafton-public-website.vercel.app'
      );
      messageSent.current = true;
    }
  }, [bookingReference, guestName, packageTitle, departureDate]);

  const firstName = guestName.split(' ')[0];

  return (
    <div className="gs-confirmation">
      <div className="gs-confirmation-icon" aria-hidden="true">🌍</div>

      <h2 style={{ marginBottom: '8px' }}>Your safari journey begins here!</h2>
      <p style={{ maxWidth: '440px', margin: '0 auto' }}>
        Thank you, {firstName}. Your booking inquiry for{' '}
        <strong style={{ color: 'var(--gs-forest)' }}>{packageTitle}</strong> has been
        received. Our team will be in touch within 24–48 hours.
      </p>

      <div className="gs-confirmation-ref" aria-label={`Booking reference: ${bookingReference}`}>
        {bookingReference}
      </div>

      <p style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-xl)', color: 'var(--gs-text-muted)' }}>
        A confirmation has been sent to your email address. Please keep your reference number
        for follow-up correspondence.
      </p>

      {departureDate && (
        <div
          style={{
            background: 'var(--gs-sand)',
            border: '1px solid var(--gs-sand-dark)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 24px',
            display: 'inline-block',
            marginBottom: 'var(--space-xl)',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Departure Date
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--gs-forest)', fontWeight: 600 }}>
            {new Date(departureDate).toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href="mailto:gstt@graftonsafaris.com"
          className="gs-btn gs-btn-ghost"
          aria-label="Contact Grafton Safaris by email"
        >
          📧 Contact Us
        </a>
        <a
          href="https://grafton-public-website.vercel.app"
          target="_top"
          className="gs-btn gs-btn-primary"
          aria-label="Return to Grafton Safaris website"
        >
          Return to Website
        </a>
        {onClose && (
          <button
            className="gs-btn gs-btn-ghost"
            onClick={onClose}
            aria-label="Close this window"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
