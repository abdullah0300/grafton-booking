'use client';
// src/components/comparison/ItineraryCompareModal.tsx
// Side-by-side comparison modal for up to 3 Grafton Safari itineraries

import { SafariPackage } from '@/data/packages';

interface ItineraryCompareModalProps {
  packages: SafariPackage[];
  onClose: () => void;
  onSelectForCustomize: (pkg: SafariPackage) => void;
  onRemoveFromCompare: (pkgId: number) => void;
}

export default function ItineraryCompareModal({
  packages,
  onClose,
  onSelectForCustomize,
  onRemoveFromCompare,
}: ItineraryCompareModalProps) {
  if (packages.length === 0) return null;

  return (
    <div className="gs-modal-backdrop" onClick={onClose}>
      <div
        className="gs-modal-compare-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Compare Safari Itineraries"
      >
        {/* Modal Header */}
        <div className="gs-modal-header">
          <div>
            <span className="gs-badge-gold">Side-by-Side Comparison</span>
            <h2>Compare Grafton Signature Journeys ({packages.length}/3)</h2>
          </div>
          <button
            onClick={onClose}
            className="gs-modal-close-btn"
            aria-label="Close comparison"
          >
            ✕
          </button>
        </div>

        {/* Comparison Table Grid */}
        <div className="gs-compare-table-wrapper">
          <div
            className="gs-compare-grid"
            style={{
              gridTemplateColumns: `200px repeat(${packages.length}, minmax(280px, 1fr))`,
            }}
          >
            {/* Header Row: Images & Titles */}
            <div className="gs-compare-cell header-label">Journey</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell package-header-cell">
                <button
                  onClick={() => onRemoveFromCompare(pkg.id)}
                  className="remove-compare-btn"
                  title="Remove from comparison"
                >
                  ✕
                </button>
                <img src={pkg.heroImage} alt={pkg.title} className="compare-hero-img" />
                <span className="compare-pkg-number">Package {pkg.id}</span>
                <h4>{pkg.title}</h4>
                <p>{pkg.durationDays} Days / {pkg.durationNights} Nights</p>
                <button
                  onClick={() => {
                    onSelectForCustomize(pkg);
                    onClose();
                  }}
                  className="gs-btn gs-btn-gold gs-btn-full"
                  style={{ marginTop: '10px' }}
                >
                  Customize ➔
                </button>
              </div>
            ))}

            {/* Strategic Focus */}
            <div className="gs-compare-cell label-cell">Strategic Focus</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell">
                <span className="gs-badge-glass">{pkg.strategicJob}</span>
              </div>
            ))}

            {/* Route & Circuit */}
            <div className="gs-compare-cell label-cell">Circuit Route</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell">
                <p style={{ fontSize: '0.85rem', color: 'var(--gs-text)' }}>{pkg.routeString}</p>
              </div>
            ))}

            {/* Best Season */}
            <div className="gs-compare-cell label-cell">Prime Months</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell">
                <strong>{pkg.bestMonths.join(', ')}</strong>
              </div>
            ))}

            {/* Travel Style */}
            <div className="gs-compare-cell label-cell">Transport Style</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell">
                <span style={{ fontSize: '0.85rem' }}>{pkg.travelStyle}</span>
              </div>
            ))}

            {/* Best For */}
            <div className="gs-compare-cell label-cell">Best Suited For</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {pkg.bestFor.map((b, i) => (
                    <span key={i} className="gs-mini-tag">{b}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Indicative Base Price */}
            <div className="gs-compare-cell label-cell">Indicative Price</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell price-highlight-cell">
                <span className="compare-price-val">
                  ${pkg.basePriceComfort.toLocaleString()}
                </span>
                <span className="compare-price-unit">per person sharing</span>
              </div>
            ))}

            {/* Key Highlights */}
            <div className="gs-compare-cell label-cell">Signature Highlights</div>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-cell highlights-cell">
                <ul>
                  {pkg.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="gs-modal-footer">
          <button onClick={onClose} className="gs-btn gs-btn-ghost">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
