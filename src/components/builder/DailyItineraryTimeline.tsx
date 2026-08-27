'use client';
// src/components/builder/DailyItineraryTimeline.tsx
// Compact Horizontal Day Navigator & Spotlight Card

import { useState } from 'react';
import { DayItinerary } from '@/data/packages';

interface DailyItineraryTimelineProps {
  itinerary: DayItinerary[];
  activeDay?: number;
  onDayClick?: (day: number) => void;
}

export default function DailyItineraryTimeline({
  itinerary,
  activeDay: controlledActiveDay,
  onDayClick,
}: DailyItineraryTimelineProps) {
  const [internalActiveDay, setInternalActiveDay] = useState<number>(1);
  const currentDayNum = controlledActiveDay || internalActiveDay;
  const currentDay = itinerary.find((d) => d.day === currentDayNum) || itinerary[0];

  const handleSelectDay = (dayNum: number) => {
    setInternalActiveDay(dayNum);
    onDayClick?.(dayNum);
  };

  const handlePrevDay = () => {
    const prev = currentDayNum > 1 ? currentDayNum - 1 : itinerary.length;
    handleSelectDay(prev);
  };

  const handleNextDay = () => {
    const next = currentDayNum < itinerary.length ? currentDayNum + 1 : 1;
    handleSelectDay(next);
  };

  return (
    <div className="gs-horizontal-itinerary-container" id="itinerary">
      {/* Header with Title & Day Step Counter */}
      <div className="gs-h-itinerary-header">
        <div>
          <span className="gs-special-promise-tag">DAY-BY-DAY JOURNEY</span>
          <h3 className="gs-h-itinerary-title">Crafted Day-by-Day Schedule</h3>
          <p className="gs-h-itinerary-sub">Every transit, game drive, and wilderness moment unhurriedly paced.</p>
        </div>

        {/* Prev / Next Controls */}
        <div className="gs-h-day-nav-controls">
          <button
            type="button"
            onClick={handlePrevDay}
            className="gs-h-nav-btn"
            title="Previous Day"
          >
            ←
          </button>
          <span className="gs-h-nav-indicator">
            Day <strong>{currentDayNum}</strong> of {itinerary.length}
          </span>
          <button
            type="button"
            onClick={handleNextDay}
            className="gs-h-nav-btn"
            title="Next Day"
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Day Pill Tab Rail */}
      <div className="gs-h-day-rail">
        {itinerary.map((day) => {
          const isActive = day.day === currentDayNum;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => handleSelectDay(day.day)}
              className={`gs-h-day-pill${isActive ? ' is-active' : ''}`}
            >
              <span className="gs-h-pill-num">Day {day.day}</span>
              <span className="gs-h-pill-name">{day.destination.split('➔')[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Single Focused Day Spotlight Card */}
      <div className="gs-h-day-spotlight-card">
        {/* Top Destination & Transit Badges */}
        <div className="gs-h-spotlight-top">
          <div>
            <span className="gs-h-spotlight-day-badge">Day {currentDay.day} Milestone</span>
            <h4 className="gs-h-spotlight-title">{currentDay.title}</h4>
          </div>
          <div className="gs-h-spotlight-badges">
            <span className="gs-h-meta-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {currentDay.startLocation} ➔ {currentDay.destination}
            </span>
            <span className="gs-h-meta-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {currentDay.travelTime}
            </span>
            <span className="gs-h-meta-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="18" y2="10" />
              </svg>
              {currentDay.transportType}
            </span>
          </div>
        </div>

        {/* Narrative & Activity */}
        <p className="gs-h-spotlight-desc">{currentDay.description}</p>

        {/* Bottom Logistics Micro-Cards: Meals & Accommodations */}
        <div className="gs-h-spotlight-footer-grid">
          <div className="gs-h-logistics-card">
            <div className="gs-h-logistics-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            <div className="gs-h-logistics-content">
              <span className="gs-h-logistics-tag">MEAL INCLUSION</span>
              <span className="gs-h-logistics-val">{currentDay.mealBasis}</span>
            </div>
          </div>

          <div className="gs-h-logistics-card">
            <div className="gs-h-logistics-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="gs-h-logistics-content">
              <span className="gs-h-logistics-tag">OVERNIGHT STAY</span>
              <span className="gs-h-logistics-val">{currentDay.accommodationBrief}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
