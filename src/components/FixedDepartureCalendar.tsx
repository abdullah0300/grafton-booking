'use client';
// src/components/FixedDepartureCalendar.tsx
// Package 8: Interactive departure date picker with live seat counts, 
// pricing display, and single supplement toggle.

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { FixedDeparture } from '@/types/booking';
import SeatAvailabilityBadge from './SeatAvailabilityBadge';

interface FixedDepartureCalendarProps {
  selectedDepartureId: string | null;
  onSelect: (departure: FixedDeparture | null) => void;
  singleSupplement: boolean;
  onToggleSupplement: (val: boolean) => void;
  adults: number;
  children: number;
}

function formatDateRange(departure: string, returnDate: string): string {
  const dep = parseISO(departure);
  const ret = parseISO(returnDate);
  const sameMonth = dep.getMonth() === ret.getMonth() && dep.getFullYear() === ret.getFullYear();
  if (sameMonth) {
    return `${format(dep, 'd')}–${format(ret, 'd MMMM yyyy')}`;
  }
  return `${format(dep, 'd MMM')} – ${format(ret, 'd MMM yyyy')}`;
}

function getDepartureStatusLabel(dep: FixedDeparture): { label: string; className: string } {
  const available = dep.max_capacity - dep.booked_seats;
  if (dep.status === 'sold_out' || available === 0) return { label: 'Sold Out', className: 'gs-badge gs-badge-sold-out' };
  if (dep.status === 'guaranteed' || dep.booked_seats >= Math.ceil(dep.max_capacity * 0.5)) return { label: 'Guaranteed', className: 'gs-badge gs-badge-guaranteed' };
  if (available <= 2) return { label: 'Almost Full', className: 'gs-badge gs-badge-low' };
  return { label: 'Available', className: 'gs-badge gs-badge-available' };
}

export default function FixedDepartureCalendar({
  selectedDepartureId,
  onSelect,
  singleSupplement,
  onToggleSupplement,
  adults,
  children: childCount,
}: FixedDepartureCalendarProps) {
  const [departures, setDepartures] = useState<FixedDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDeparture = departures.find((d) => d.id === selectedDepartureId) ?? null;
  const totalGuests = adults + childCount;

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/fixed-departures?packageId=8');
        const json = await res.json();
        if (json.success) {
          setDepartures(json.data);
        } else {
          setError('Unable to load departure dates. Please refresh.');
        }
      } catch {
        setError('Network error. Please check your connection and refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchDepartures();
  }, []);

  // Price calculation
  const baseTotal = selectedDeparture
    ? selectedDeparture.price_per_person * totalGuests
    : 0;
  const supplementTotal = selectedDeparture && singleSupplement
    ? selectedDeparture.single_supplement_price
    : 0;
  const grandTotal = baseTotal + supplementTotal;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gs-text-muted)' }}>
        <div className="gs-spinner" style={{ margin: '0 auto 12px', color: 'var(--gs-forest)' }} />
        <p>Loading available departure dates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gs-alert gs-alert-error">
        <span>⚠</span>
        <span>{error}</span>
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="gs-alert gs-alert-error">
        <span>ℹ</span>
        <span>No upcoming departures available at this time. Please contact us directly.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Departure Date List */}
      <div>
        <div className="gs-section-title">
          <h3>Select Departure Date</h3>
        </div>
        <div className="gs-departure-grid" role="radiogroup" aria-label="Available departure dates">
          {departures.map((dep) => {
            const isSoldOut = dep.status === 'sold_out' || dep.available_seats === 0;
            const isSelected = dep.id === selectedDepartureId;
            const { label, className: badgeClass } = getDepartureStatusLabel(dep);
            const notEnoughSeats = dep.available_seats < totalGuests;

            return (
              <div
                key={dep.id}
                className={`gs-departure-card${isSelected ? ' is-selected' : ''}${isSoldOut || notEnoughSeats ? ' is-sold-out' : ''}`}
                onClick={() => {
                  if (!isSoldOut && !notEnoughSeats) {
                    onSelect(isSelected ? null : dep);
                  }
                }}
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isSoldOut || notEnoughSeats}
                tabIndex={isSoldOut || notEnoughSeats ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isSoldOut && !notEnoughSeats) {
                    onSelect(isSelected ? null : dep);
                  }
                }}
              >
                <div className="gs-departure-dates">
                  <div className="gs-departure-main-date">
                    {formatDateRange(dep.departure_date, dep.return_date)}
                  </div>
                  <div className="gs-departure-return">
                    11-day Northern Highlands circuit
                  </div>
                  {notEnoughSeats && !isSoldOut && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--gs-error)', marginTop: '3px' }}>
                      Only {dep.available_seats} seat{dep.available_seats !== 1 ? 's' : ''} — reduce guest count to book
                    </div>
                  )}
                </div>

                <div className="gs-departure-meta">
                  <SeatAvailabilityBadge
                    maxCapacity={dep.max_capacity}
                    bookedSeats={dep.booked_seats}
                    showDots={true}
                  />
                  <span className={badgeClass}>{label}</span>
                  <div className="gs-departure-price">
                    ${dep.price_per_person.toLocaleString()}
                    <span> / person</span>
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute' as const,
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '22px',
                      height: '22px',
                      background: 'var(--gs-forest)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Single Supplement */}
      {selectedDeparture && (
        <div>
          <div className="gs-section-title">
            <h3>Room Option</h3>
          </div>
          <div
            className={`gs-supplement-box${singleSupplement ? ' is-active' : ''}`}
            onClick={() => onToggleSupplement(!singleSupplement)}
            role="checkbox"
            aria-checked={singleSupplement}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onToggleSupplement(!singleSupplement);
            }}
          >
            <div className="gs-supplement-info">
              <h4>Single Room Supplement</h4>
              <p>Guaranteed private room throughout the journey — no shared accommodation.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="gs-supplement-price">
                +${selectedDeparture.single_supplement_price.toLocaleString()}
              </div>
              <div className={`gs-toggle${singleSupplement ? ' active' : ''}`} aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      {selectedDeparture && (
        <div className="gs-price-summary">
          <div className="gs-price-row">
            <span>${selectedDeparture.price_per_person.toLocaleString()} × {totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
            <strong>${baseTotal.toLocaleString()}</strong>
          </div>
          {singleSupplement && (
            <div className="gs-price-row">
              <span>Single Room Supplement</span>
              <strong>+${supplementTotal.toLocaleString()}</strong>
            </div>
          )}
          <div className="gs-price-row total">
            <span>Indicative Total</span>
            <span className="price-amount">${grandTotal.toLocaleString()}</span>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '8px', textAlign: 'right' }}>
            * Final price confirmed upon booking review. Flights excluded.
          </p>
        </div>
      )}
    </div>
  );
}
