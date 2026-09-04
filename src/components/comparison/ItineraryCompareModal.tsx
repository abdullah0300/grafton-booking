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
        {/* Pinned Modal Header */}
        <div className="gs-modal-compare-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Compare Journeys</h2>
              <span className="gs-badge-olive" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                {packages.length} of 3 Selected
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
              Compare duration, routing, highlights, and indicative pricing side-by-side.
            </p>
          </div>
          <button
            onClick={onClose}
            className="gs-modal-close-btn"
            aria-label="Close comparison"
          >
            ✕
          </button>
        </div>

        {/* Inner Scrollable Body */}
        <div className="gs-modal-compare-body">
          {/* Comparison Card Columns Grid */}
          <div className="gs-compare-columns-grid" style={{ gridTemplateColumns: `repeat(${Math.max(packages.length, 2)}, minmax(280px, 1fr))` }}>
            {packages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-card-col">
                {/* Card Header & Media */}
                <div className="gs-compare-card-header">
                  <button
                    onClick={() => onRemoveFromCompare(pkg.id)}
                    className="gs-compare-remove-btn"
                    title={`Remove ${pkg.title} from comparison`}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                  <div className="gs-compare-img-wrap">
                    <img src={pkg.heroImage} alt={pkg.title} className="gs-compare-img" loading="lazy" />
                    <span className="gs-compare-duration-tag">
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </span>
                  </div>

                  <div className="gs-compare-header-meta">
                    <span className="gs-compare-pkg-num">Journey 0{pkg.id}</span>
                    <h3 className="gs-compare-pkg-title">{pkg.title}</h3>
                    <p className="gs-compare-pkg-sub">{pkg.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectForCustomize(pkg);
                      onClose();
                    }}
                    className="gs-btn-orange gs-btn-full"
                    style={{ padding: '10px 16px', fontSize: '0.86rem', marginTop: '12px' }}
                  >
                    Customize This Safari ➔
                  </button>
                </div>

                {/* Structured Comparison Rows */}
                <div className="gs-compare-sections-list">
                  {/* 1. Indicative Investment */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Indicative Investment</span>
                    <div className="gs-compare-price-block">
                      <span className="gs-compare-price-val">
                        ${pkg.basePriceComfort.toLocaleString()}
                      </span>
                      <span className="gs-compare-price-sub">per person sharing (Comfort)</span>
                    </div>
                  </div>

                  {/* 2. Strategic Job / Focus */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Primary Purpose</span>
                    <p className="gs-compare-row-val" style={{ fontWeight: 600, color: 'var(--gs-forest)' }}>
                      {pkg.strategicJob}
                    </p>
                  </div>

                  {/* 3. Circuit Route */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Circuit Route</span>
                    <p className="gs-compare-row-val" style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                      {pkg.routeString}
                    </p>
                  </div>

                  {/* 4. Prime Travel Season */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Prime Months</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {pkg.bestMonths.map((m, idx) => (
                        <span key={idx} className="gs-month-tag">{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* 5. Transport Style */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Transport Style</span>
                    <p className="gs-compare-row-val" style={{ fontSize: '0.82rem' }}>
                      {pkg.travelStyle}
                    </p>
                  </div>

                  {/* 6. Best Suited For */}
                  <div className="gs-compare-section-row">
                    <span className="gs-compare-row-label">Best Suited For</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {pkg.bestFor.map((b, i) => (
                        <span key={i} className="gs-mini-tag">{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* 7. Key Highlights */}
                  <div className="gs-compare-section-row" style={{ borderBottom: 'none' }}>
                    <span className="gs-compare-row-label">Key Highlights</span>
                    <ul className="gs-compare-highlights-list">
                      {pkg.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholder Slot when only 1 or 2 are compared */}
            {packages.length < 3 && (
              <div className="gs-compare-empty-slot">
                <div className="gs-compare-empty-content">
                  <span style={{ fontSize: '1.8rem', color: 'var(--gs-olive)', opacity: 0.6 }}>+</span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gs-forest)', margin: '4px 0' }}>
                    Add Another Journey
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', margin: 0, maxWidth: '180px' }}>
                    Select another journey on the catalog to compare up to 3 side-by-side.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
