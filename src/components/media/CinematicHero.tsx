'use client';
// src/components/media/CinematicHero.tsx
// Awwwards-caliber visual hero featuring ambient looping video,
// audio mood toggle, high-resolution photography fallback, and full-screen video modal.

import { useState, useRef } from 'react';
import { SafariPackage } from '@/data/packages';

interface CinematicHeroProps {
  packageData: SafariPackage;
  onCustomizeClick?: () => void;
  onOpenVideoModal?: () => void;
}

export default function CinematicHero({
  packageData,
  onCustomizeClick,
  onOpenVideoModal,
}: CinematicHeroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="gs-hero-cinematic">
      {/* Video / Image Canvas */}
      <div className="gs-hero-media-wrapper">
        {!videoError ? (
          <video
            ref={videoRef}
            className="gs-hero-video"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            poster={packageData.heroImage}
            onError={() => setVideoError(true)}
          >
            <source src={packageData.heroVideo} type="video/mp4" />
          </video>
        ) : (
          <div
            className="gs-hero-fallback-image"
            style={{ backgroundImage: `url(${packageData.heroImage})` }}
          />
        )}

        {/* Ambient Dark Gradient Overlays */}
        <div className="gs-hero-overlay" />
      </div>

      {/* Floating Media Controls (Top Right) */}
      <div className="gs-hero-controls">
        {!videoError && (
          <>
            <button
              onClick={toggleSound}
              className="gs-control-btn"
              title={isMuted ? 'Unmute Ambient Wildlife Sounds' : 'Mute Sound'}
              aria-label="Toggle ambient video audio"
            >
              {isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <button
              onClick={togglePlay}
              className="gs-control-btn"
              title={isPlaying ? 'Pause Background Video' : 'Play Video'}
              aria-label="Toggle background video playback"
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </>
        )}
        <button
          onClick={onOpenVideoModal}
          className="gs-control-btn gs-control-btn-highlight"
          title="Watch Full Cinematic Journey Preview"
          aria-label="Watch full screen cinematic journey preview"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <span className="hide-mobile">Watch Safari Film</span>
        </button>
      </div>

      {/* Hero Content Canvas */}
      <div className="gs-hero-content">
        <div className="gs-hero-tag-row">
          <span className="gs-badge-gold">Signature Journey {packageData.id}</span>
          <span className="gs-badge-glass">{packageData.durationDays} Days / {packageData.durationNights} Nights</span>
          <span className="gs-badge-glass">{packageData.strategicJob}</span>
        </div>

        <h1 className="gs-hero-title">{packageData.title}</h1>
        <p className="gs-hero-subtitle">{packageData.subtitle}</p>

        {/* Key Badges Strip */}
        <div className="gs-hero-highlights-strip">
          <div className="gs-hero-stat">
            <span className="stat-label">Prime Season</span>
            <span className="stat-value">{packageData.bestMonths.slice(0, 3).join(', ')}</span>
          </div>
          <div className="gs-hero-divider" />
          <div className="gs-hero-stat">
            <span className="stat-label">Travel Style</span>
            <span className="stat-value">{packageData.travelStyle.split(',')[0]}</span>
          </div>
          <div className="gs-hero-divider" />
          <div className="gs-hero-stat">
            <span className="stat-label">Starting From</span>
            <span className="stat-value gold-text">
              ${packageData.basePriceComfort.toLocaleString()} <span className="stat-unit">/ person</span>
            </span>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="gs-hero-cta-row">
          {onCustomizeClick && (
            <button
              onClick={onCustomizeClick}
              className="gs-btn-orange"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              Customize This Journey ➔
            </button>
          )}
          <a href="#itinerary" className="gs-btn gs-btn-ghost-light gs-btn-lg">
            Explore Day-by-Day ↓
          </a>
        </div>
      </div>
    </div>
  );
}
