'use client';
// src/components/maps/InteractiveRouteMap.tsx
// Undulating Curved Journey Trail matching Image 6

import React from 'react';
import { SafariPackage } from '@/data/packages';

interface InteractiveRouteMapProps {
  packageData: SafariPackage;
  activeDay?: number;
  onSelectDay?: (day: number) => void;
}

export default function InteractiveRouteMap({ packageData }: InteractiveRouteMapProps) {
  // Extract up to 4 key highlights / stops for the undulating wave
  const stops = packageData.itinerary.slice(0, 4).map((day, idx) => {
    const icons = [
      // 1. Info / Guide
      <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>,
      // 2. Globe / Circuit
      <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>,
      // 3. Savannah / Nature
      <svg key="3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
      </svg>,
      // 4. Wildlife / Flag
      <svg key="4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>,
    ];

    return {
      title: day.title,
      destination: day.destination,
      description: day.activity || day.description,
      icon: icons[idx % icons.length],
      isLow: idx % 2 === 1,
    };
  });

  return (
    <div className="gs-curved-trail-section">
      <div className="gs-curved-trail-wrapper">
        {/* Curved Dotted Connecting Path */}
        <svg className="gs-curved-trail-svg" viewBox="0 0 1000 160" preserveAspectRatio="none">
          <path
            d="M 125,50 C 250,50 250,110 375,110 C 500,110 500,50 625,50 C 750,50 750,110 875,110"
            fill="none"
            stroke="#DF6D2D"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
        </svg>

        {/* 4 Staggered Waypoints */}
        <div className="gs-curved-trail-grid">
          {stops.map((stop, i) => (
            <div
              key={i}
              className={`gs-trail-node-col${stop.isLow ? ' is-low' : ' is-high'}`}
            >
              <div className="gs-trail-badge-circle">
                {stop.icon}
              </div>
              <h4 className="gs-trail-node-title">{stop.title}</h4>
              <p className="gs-trail-node-desc">
                {stop.description.length > 105
                  ? `${stop.description.slice(0, 105)}…`
                  : stop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
