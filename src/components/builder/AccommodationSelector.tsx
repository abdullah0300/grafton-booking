'use client';
// src/components/builder/AccommodationSelector.tsx
// High-End Luxury Showcase for Curated Safari Lodges & Tented Camps

import { SafariPackage } from '@/data/packages';

interface AccommodationSelectorProps {
  packageData: SafariPackage;
  selectedTier?: 'Comfort' | 'Signature' | 'Reserve';
  onSelectTier?: (tier: 'Comfort' | 'Signature' | 'Reserve') => void;
}

export default function AccommodationSelector({
  packageData,
  selectedTier = 'Comfort',
}: AccommodationSelectorProps) {
  const { accommodation } = packageData;

  // Selected tier option or fallback
  const currentOption = accommodation.options.find((opt) => opt.tier === selectedTier) || accommodation.options[0];
  const properties = currentOption?.properties || accommodation.options.flatMap((opt) => opt.properties);

  return (
    <div className="gs-luxury-accommodations-container">
      {/* Editorial Lead Banner */}
      <div className="gs-accommodations-editorial-intro">
        <span className="gs-special-promise-tag">VETTED WILDERNESS SANCTUARIES</span>
        <h4 className="gs-accommodations-intro-title">
          Curated Lodges &amp; Seasonal Bush Camps
        </h4>
        <p className="gs-accommodations-intro-desc">
          Every lodge and seasonal tented camp in this itinerary is vetted for prime wildlife positioning, unfettered savannah immersion, exceptional bush hospitality, and eco-friendly solar operation.
        </p>
      </div>

      {/* Luxury Properties Grid */}
      <div className="gs-luxury-properties-grid">
        {properties.map((prop, idx) => (
          <div key={idx} className="gs-luxury-stay-card">
            {/* Media Banner */}
            <div className="gs-stay-img-wrap">
              <img
                src={prop.image}
                alt={prop.name}
                className="gs-stay-img"
                loading="lazy"
              />
              <span className="gs-stay-type-badge">{prop.type}</span>
              <div className="gs-stay-location-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span>{prop.location}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="gs-stay-details">
              <div className="gs-stay-header">
                <span className="gs-stay-tier-label">{selectedTier} Standard Stay</span>
                <h4 className="gs-stay-name">{prop.name}</h4>
              </div>

              {/* Amenities & Comfort Standards */}
              <div className="gs-stay-amenities-list">
                {prop.facilities.map((fac, i) => (
                  <div key={i} className="gs-stay-amenity-chip">
                    <span className="gs-amenity-check">✓</span>
                    <span>{fac}</span>
                  </div>
                ))}
              </div>

              {/* Suitability Pills */}
              <div className="gs-stay-suitability-block">
                <span className="gs-suitability-caption">Best Suited For:</span>
                <div className="gs-suitability-pills-wrap">
                  {prop.suitability.map((suit, i) => (
                    <span key={i} className="gs-suitability-pill">{suit}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
