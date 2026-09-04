'use client';
// src/components/maps/InteractiveRouteMap.tsx
// High-End Animated Safari Journey Trail with Real-Time Explorer Motion

import React, { useState } from 'react';
import { SafariPackage } from '@/data/packages';

interface InteractiveRouteMapProps {
  packageData: SafariPackage;
  activeDay?: number;
  onSelectDay?: (day: number) => void;
}

export default function InteractiveRouteMap({ packageData }: InteractiveRouteMapProps) {
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);

  // Extract up to 4 key highlights / stops along the undulating route
  const stops = packageData.itinerary.slice(0, 4).map((day, idx) => {
    const icons = [
      // 1. Arusha / Gate departure
      <svg key="1" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>,
      // 2. Tarangire / Manyara wildlife
      <svg key="2" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <circle cx="12" cy="12" r="10" />
      </svg>,
      // 3. Serengeti / Ngorongoro Crater
      <svg key="3" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
      </svg>,
      // 4. Prime Migration Camp / Luxury Lodge
      <svg key="4" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>,
    ];

    return {
      dayNum: day.day,
      title: day.title,
      destination: day.destination,
      description: day.activity || day.description,
      icon: icons[idx % icons.length],
      isLow: idx % 2 === 1,
    };
  });

  const trailPathD = "M 125,50 C 250,50 250,110 375,110 C 500,110 500,50 625,50 C 750,50 750,110 875,110";

  return (
    <div className="gs-curved-trail-section">
      <div className="gs-curved-trail-wrapper">
        {/* Curved Dotted Connecting Path with Animated Motion */}
        <svg className="gs-curved-trail-svg" viewBox="0 0 1000 160" preserveAspectRatio="none">
          <defs>
            {/* Trail Gradient */}
            <linearGradient id="gsTrailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DF6D2D" />
              <stop offset="50%" stopColor="#D4AF6B" />
              <stop offset="100%" stopColor="#2E7D52" />
            </linearGradient>

            {/* Glowing filter for the moving vehicle beacon */}
            <filter id="gsVehicleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Underlay Trail Shadow / Track */}
          <path
            d={trailPathD}
            fill="none"
            stroke="rgba(20, 40, 32, 0.08)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Animated Flowing Dotted Trail */}
          <path
            d={trailPathD}
            fill="none"
            stroke="url(#gsTrailGradient)"
            strokeWidth="3"
            strokeDasharray="8 8"
            className="gs-animated-trail-flow"
          />

          {/* ── Moving Safari Expedition Traveler (SVG animateMotion) ── */}
          <g className="gs-moving-expedition-group">
            <animateMotion
              dur="16s"
              repeatCount="indefinite"
              rotate="auto"
              path={trailPathD}
            />

            {/* Pulsing Radar Aura */}
            <circle
              r="18"
              fill="none"
              stroke="#DF6D2D"
              strokeWidth="1.5"
              className="gs-explorer-radar-pulse"
            />

            {/* Main Obsidian & Gold Vehicle Badge */}
            <circle
              r="14"
              fill="#142820"
              stroke="#D4AF6B"
              strokeWidth="2"
              filter="url(#gsVehicleGlow)"
            />

            {/* Inner Emerald Beacon */}
            <circle
              r="4.5"
              fill="#DF6D2D"
            />

            {/* Safari 4x4 / Explorer Silhouette Icon */}
            <g transform="translate(-7, -7) scale(0.58)">
              <path
                d="M5 11l2-4h10l2 4M3 17h18M5 17v-6h14v6M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>

        {/* 4 Staggered Luxury Waypoint Nodes */}
        <div className="gs-curved-trail-grid">
          {stops.map((stop, i) => {
            const isHovered = hoveredStop === i;

            return (
              <div
                key={i}
                className={`gs-trail-node-col${stop.isLow ? ' is-low' : ' is-high'}${isHovered ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHoveredStop(i)}
                onMouseLeave={() => setHoveredStop(null)}
              >
                {/* Waypoint Step Indicator */}
                <div className="gs-trail-badge-circle">
                  {stop.icon}
                  <span className="gs-trail-step-pill">Stop 0{i + 1}</span>
                </div>

                <span className="gs-trail-dest-tag">{stop.destination}</span>
                <h4 className="gs-trail-node-title">{stop.title}</h4>
                <p className="gs-trail-node-desc">
                  {stop.description.length > 95
                    ? `${stop.description.slice(0, 95)}…`
                    : stop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

