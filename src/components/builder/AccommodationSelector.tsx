'use client';
// src/components/builder/AccommodationSelector.tsx
// Accommodation Tier Switcher (Comfort, Signature, Reserve)
// Complies strictly with the "No external hotel links" rule — renders high-res galleries,
// camp facilities, honeymoon/family suitability badges, and price differentials.

import { SafariPackage } from '@/data/packages';

interface AccommodationSelectorProps {
  packageData: SafariPackage;
  selectedTier: 'Comfort' | 'Signature' | 'Reserve';
  onSelectTier: (tier: 'Comfort' | 'Signature' | 'Reserve') => void;
}

export default function AccommodationSelector({
  packageData,
  selectedTier,
  onSelectTier,
}: AccommodationSelectorProps) {
  const { accommodation } = packageData;

  const tiers: {
    id: 'Comfort' | 'Signature' | 'Reserve';
    name: string;
    brief: string;
    priceNote: string;
  }[] = [
    {
      id: 'Comfort',
      name: 'Comfort Tier',
      brief: accommodation.comfortBrief,
      priceNote: 'Included in Base Rate',
    },
    {
      id: 'Signature',
      name: 'Signature Tier',
      brief: accommodation.signatureBrief,
      priceNote: packageData.basePriceSignature
        ? `+$${(packageData.basePriceSignature - packageData.basePriceComfort).toLocaleString()} pp`
        : 'Upgraded Bush Luxury',
    },
    {
      id: 'Reserve',
      name: 'Reserve Tier',
      brief: accommodation.reserveBrief,
      priceNote: 'Price to be reviewed',
    },
  ];

  return (
    <div className="gs-accommodation-section">
      <div className="gs-section-header">
        <span className="gs-badge-gold">Curated Stays</span>
        <h2>Select Your Accommodation Standard</h2>
        <p>
          Every lodge and seasonal camp is vetted for prime wildlife positioning, exceptional hospitality, and authentic bush ambiance.
        </p>
      </div>

      {/* Tier Switcher Cards */}
      <div className="gs-tier-selector-grid">
        {tiers.map((t) => {
          const isSelected = selectedTier === t.id;
          return (
            <div
              key={t.id}
              className={`gs-tier-card${isSelected ? ' is-selected' : ''}`}
              onClick={() => onSelectTier(t.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectTier(t.id);
              }}
            >
              <div className="gs-tier-card-top">
                <div className="gs-tier-radio-indicator">
                  <span className={`radio-dot${isSelected ? ' checked' : ''}`} />
                </div>
                <div>
                  <h4>{t.name}</h4>
                  <span className="tier-price-badge">{t.priceNote}</span>
                </div>
              </div>
              <p className="tier-brief-text">{t.brief}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Showcase for Selected Tier's Example Properties */}
      <div className="gs-properties-showcase">
        <div className="gs-properties-showcase-title">
          <span>Featured Properties in {selectedTier} Tier</span>
        </div>

        {accommodation.options
          .filter((opt) => opt.tier === selectedTier)
          .flatMap((opt) => opt.properties)
          .map((prop, idx) => (
            <div key={idx} className="gs-property-card">
              <div className="property-img-wrapper">
                <img src={prop.image} alt={prop.name} className="property-img" loading="lazy" />
                <span className="property-type-tag">{prop.type}</span>
              </div>
              <div className="property-details">
                <div className="property-header">
                  <h4>{prop.name}</h4>
                  <span className="property-location">📍 {prop.location}</span>
                </div>

                <div className="property-amenities-row">
                  {prop.facilities.map((fac, i) => (
                    <span key={i} className="property-facility-chip">✓ {fac}</span>
                  ))}
                </div>

                <div className="property-suitability-row">
                  <span className="suitability-label">Ideal For:</span>
                  {prop.suitability.map((suit, i) => (
                    <span key={i} className="suitability-chip">{suit}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
