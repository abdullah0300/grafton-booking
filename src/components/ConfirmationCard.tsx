'use client';
// src/components/ConfirmationCard.tsx
// High-End Luxury Booking Confirmation & Next Steps Hub

import { useEffect, useRef, useState } from 'react';
import Link from 'next/navigation';

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
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Fire postMessage to parent window for iframe integration
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
        '*'
      );
      messageSent.current = true;
    }
  }, [bookingReference, guestName, packageTitle, departureDate]);

  const firstName = guestName ? guestName.split(' ')[0] : 'Traveler';

  const handleCopyRef = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bookingReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="gs-confirmation-page-container">
      <div className="gs-confirmation-card">
        {/* Animated Success Badge */}
        <div className="gs-confirmation-badge-wrap">
          <div className="gs-confirmation-check-circle">✓</div>
        </div>

        {/* Header Tag & Title */}
        <span className="gs-badge-olive" style={{ marginBottom: '10px' }}>
          Inquiry Received · Specialist Review
        </span>
        <h2 className="gs-confirmation-headline">Your Safari Journey Begins Here</h2>

        {/* Narrative Paragraph */}
        <p className="gs-confirmation-message">
          Thank you, <strong>{firstName}</strong>. Your customized safari proposal request for{' '}
          <strong style={{ color: 'var(--gs-forest)' }}>{packageTitle}</strong> has been received by our Arusha operations team. A dedicated safari consultant will review your route and contact you within <strong>24–48 hours</strong> with your finalized quotation.
        </p>

        {/* Booking Reference Highlight Box */}
        <div className="gs-confirmation-ref-box">
          <div>
            <span className="gs-confirmation-ref-label">YOUR GRAFTON REFERENCE CODE</span>
            <span className="gs-confirmation-ref-code">{bookingReference}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyRef}
            className="gs-btn-copy-ref"
            title="Copy reference code"
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>

        {/* Trip Parameters Highlights */}
        {departureDate && (
          <div className="gs-confirmation-params-grid">
            <div className="gs-confirmation-param-item">
              <span className="gs-confirmation-param-label">Target Departure</span>
              <span className="gs-confirmation-param-val">
                {new Date(departureDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="gs-confirmation-param-item">
              <span className="gs-confirmation-param-label">Proposal Status</span>
              <span className="gs-confirmation-param-val" style={{ color: 'var(--gs-orange)' }}>
                ⏳ Under Specialist Review
              </span>
            </div>
            <div className="gs-confirmation-param-item">
              <span className="gs-confirmation-param-label">Client Portal Access</span>
              <span className="gs-confirmation-param-val" style={{ color: '#2E7D52' }}>
                ✓ Synchronized to Account
              </span>
            </div>
          </div>
        )}

        <p className="gs-confirmation-note">
          A summary has been dispatched to your email address. You can also track consultant updates or re-open your itinerary anytime in the <strong>My Journeys Portal</strong>.
        </p>

        {/* Actions Button Row */}
        <div className="gs-confirmation-actions-row">
          <a
            href={`/my-trips?ref=${encodeURIComponent(bookingReference)}`}
            className="gs-btn-orange"
            style={{ padding: '12px 24px', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            Track in My Journeys Portal ➔
          </a>

          <a
            href="mailto:gstt@graftonsafaris.com"
            className="gs-btn-portal-back"
            style={{ textDecoration: 'none' }}
          >
            ✉ Contact Specialist
          </a>

          {onClose && (
            <button
              type="button"
              className="gs-btn-portal-back"
              onClick={onClose}
            >
              Back to Catalog
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
