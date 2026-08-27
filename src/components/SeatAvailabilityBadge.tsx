'use client';
// src/components/SeatAvailabilityBadge.tsx
// Shows a visual dot-grid (max 6) + text label for live seat counts

interface SeatAvailabilityBadgeProps {
  maxCapacity: number;
  bookedSeats: number;
  showDots?: boolean;
}

export default function SeatAvailabilityBadge({
  maxCapacity,
  bookedSeats,
  showDots = true,
}: SeatAvailabilityBadgeProps) {
  const available = Math.max(0, maxCapacity - bookedSeats);
  const isLow = available > 0 && available <= 2;
  const isSoldOut = available === 0;

  const badgeClass = isSoldOut
    ? 'gs-badge gs-badge-sold-out'
    : isLow
    ? 'gs-badge gs-badge-low'
    : 'gs-badge gs-badge-available';

  return (
    <div className="gs-seat-indicator" role="status" aria-label={`${available} of ${maxCapacity} seats available`}>
      {showDots && (
        <div className="gs-seat-dots" aria-hidden="true">
          {Array.from({ length: maxCapacity }).map((_, i) => (
            <span
              key={i}
              className={`gs-seat-dot ${i < bookedSeats ? 'booked' : 'available'}`}
              title={i < bookedSeats ? 'Seat taken' : 'Seat available'}
            />
          ))}
        </div>
      )}
      <span className={badgeClass}>
        {isSoldOut ? (
          'Sold out'
        ) : isLow ? (
          `Only ${available} left!`
        ) : (
          `${available} / ${maxCapacity} seats`
        )}
      </span>
    </div>
  );
}
