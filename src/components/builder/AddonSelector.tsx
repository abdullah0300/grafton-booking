'use client';
// src/components/builder/AddonSelector.tsx
// Curated Add-on Experiences & Extensions with age/location restriction validation.

import { GLOBAL_ADDONS, SafariAddon } from '@/data/packages';

interface AddonSelectorProps {
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
  adultsCount: number;
}

export default function AddonSelector({
  selectedAddonIds,
  onToggleAddon,
  adultsCount,
}: AddonSelectorProps) {
  return (
    <div className="gs-addons-section">
      <div className="gs-section-header">
        <span className="gs-badge-gold">Signature Add-ons</span>
        <h2>Enhance Your Safari Adventure</h2>
        <p>Curated moments to elevate your journey. Added seamlessly to your custom itinerary.</p>
      </div>

      <div className="gs-addons-grid">
        {GLOBAL_ADDONS.map((addon) => {
          const isSelected = selectedAddonIds.includes(addon.id);
          const totalCostForParty = addon.pricePerPerson * adultsCount;

          return (
            <div
              key={addon.id}
              className={`gs-addon-card${isSelected ? ' is-selected' : ''}`}
              onClick={() => onToggleAddon(addon.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onToggleAddon(addon.id);
              }}
            >
              <div className="gs-addon-card-top">
                <span className="gs-badge-glass">{addon.category}</span>
                <div className="gs-addon-toggle-box">
                  <span className="addon-price">+${addon.pricePerPerson} <span className="pp">pp</span></span>
                  <div className={`gs-toggle${isSelected ? ' active' : ''}`} />
                </div>
              </div>

              <h4>{addon.name}</h4>
              <p className="addon-desc">{addon.description}</p>

              <div className="addon-meta-row">
                <span className="addon-locations">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {addon.locations.join(', ')}
                </span>
                {addon.minAge && (
                  <span className="addon-age-limit">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Min age: {addon.minAge}+ yrs
                  </span>
                )}
              </div>

              {isSelected && (
                <div className="addon-party-total">
                  <span>Total for {adultsCount} adult{adultsCount > 1 ? 's' : ''}:</span>
                  <strong>+${totalCostForParty.toLocaleString()}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
