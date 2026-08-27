'use client';
// src/components/builder/LiveSummaryFloatingBar.tsx
// Floating bottom summary bar featuring real-time price calculation,
// 30-day draft persistence, shareable link copy, and quotation submission.

import { useState } from 'react';
import { PriceCalculationResult } from '@/lib/pricingEngine';
import { SafariPackage } from '@/data/packages';

interface LiveSummaryFloatingBarProps {
  packageData: SafariPackage;
  calculation: PriceCalculationResult;
  adultsCount: number;
  childrenCount: number;
  travelDate?: string;
  travelMonth?: string;
  selectedTier: 'Comfort' | 'Signature' | 'Reserve';
  onSaveDraft: () => void;
  onShareLink: () => void;
  onRequestQuote: () => void;
  onPrintView?: () => void;
  submittingQuote?: boolean;
}

export default function LiveSummaryFloatingBar({
  packageData,
  calculation,
  adultsCount,
  childrenCount,
  travelDate,
  travelMonth,
  selectedTier,
  onSaveDraft,
  onShareLink,
  onRequestQuote,
  onPrintView,
  submittingQuote = false,
}: LiveSummaryFloatingBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalGuests = adultsCount + childrenCount;

  const handleShare = () => {
    onShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      {/* ── Collapsible Breakdown Drawer ───────────────────────────────── */}
      {drawerOpen && (
        <div className="gs-summary-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div
            className="gs-summary-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="drawer-header">
              <div>
                <span className="gs-badge-gold">{calculation.priceStatus}</span>
                <h3>{packageData.title} — Itinerary Summary</h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="drawer-close-btn">
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section">
                <h4>Trip Parameters</h4>
                <div className="drawer-params-grid">
                  <div><strong>Party:</strong> {adultsCount} Adult(s){childrenCount > 0 ? `, ${childrenCount} Child(ren)` : ''}</div>
                  <div><strong>Season:</strong> {calculation.seasonLabel}</div>
                  <div><strong>Dates:</strong> {travelDate || travelMonth || 'Flexible / To be agreed'}</div>
                  <div><strong>Tier:</strong> {selectedTier} Accommodation</div>
                  <div><strong>Duration:</strong> {packageData.durationDays} Days / {packageData.durationNights} Nights</div>
                  <div><strong>Circuit:</strong> {packageData.routeString}</div>
                </div>
              </div>

              {!calculation.isReserveTier && calculation.indicativeTotalPrice && (
                <div className="drawer-section">
                  <h4>Cost Breakdown (USD)</h4>
                  <div className="drawer-price-lines">
                    <div className="price-line">
                      <span>Adults Base (${calculation.breakdown.basePerAdult.toLocaleString()} × {adultsCount})</span>
                      <strong>${calculation.breakdown.adultsSubtotal.toLocaleString()}</strong>
                    </div>
                    {childrenCount > 0 && (
                      <div className="price-line">
                        <span>Children Base (${calculation.breakdown.basePerChild.toLocaleString()} × {childrenCount})</span>
                        <strong>${calculation.breakdown.childrenSubtotal.toLocaleString()}</strong>
                      </div>
                    )}
                    {calculation.breakdown.singleSupplementTotal > 0 && (
                      <div className="price-line">
                        <span>Single Room Supplement</span>
                        <strong>+${calculation.breakdown.singleSupplementTotal.toLocaleString()}</strong>
                      </div>
                    )}
                    {calculation.breakdown.addonsTotal > 0 && (
                      <div className="price-line">
                        <span>Signature Add-ons</span>
                        <strong>+${calculation.breakdown.addonsTotal.toLocaleString()}</strong>
                      </div>
                    )}
                    {calculation.breakdown.vehicleCostSavingPerPerson > 0 && (
                      <div className="price-line saving">
                        <span>Vehicle Sharing Discount ({totalGuests} guests)</span>
                        <strong>-${(calculation.breakdown.vehicleCostSavingPerPerson * totalGuests).toLocaleString()}</strong>
                      </div>
                    )}
                    <div className="price-line total-line">
                      <span>Indicative Trip Total</span>
                      <span className="total-gold">${calculation.indicativeTotalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="drawer-section">
                <h4>What Is Included</h4>
                <ul className="drawer-inclusions-list">
                  {packageData.inclusions.map((inc, i) => (
                    <li key={i}>✓ {inc}</li>
                  ))}
                </ul>
              </div>

              <p className="drawer-disclaimer">{calculation.disclaimer}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Bar ─────────────────────────────────────────── */}
      <div className="gs-floating-bar">
        <div className="gs-floating-bar-inner">
          {/* Left: Party & Season summary */}
          <div className="gs-bar-summary-left">
            <div className="gs-bar-title-row">
              <span className="gs-badge-gold-sm">{calculation.season} Season</span>
              <span className="gs-bar-party-text">
                {adultsCount} Adult{adultsCount > 1 ? 's' : ''}{childrenCount > 0 ? `, ${childrenCount} Child(ren)` : ''} · {selectedTier}
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="gs-bar-breakdown-link"
            >
              {drawerOpen ? 'Hide Breakdown ↑' : 'View Full Summary & Inclusions ↓'}
            </button>
          </div>

          {/* Center: Live Dynamic Price Ticker */}
          <div className="gs-bar-price-center">
            {calculation.isReserveTier ? (
              <div className="reserve-price-notice">
                <span className="price-title">Price to be reviewed</span>
                <span className="price-sub">Custom bespoke quotation</span>
              </div>
            ) : (
              <div>
                <span className="price-title">Indicative Price</span>
                <div className="price-digits">
                  ${calculation.indicativePricePerPerson?.toLocaleString()}
                  <span className="unit"> / person</span>
                </div>
                <span className="price-sub">Total: ${calculation.indicativeTotalPrice?.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="gs-bar-actions-right">
            {onPrintView && (
              <button
                type="button"
                onClick={onPrintView}
                className="gs-btn gs-btn-ghost gs-btn-sm"
                title="Download or Print formatted safari proposal"
                style={{ color: 'var(--gs-forest)', borderColor: 'var(--gs-sand-dark)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print / PDF
              </button>
            )}
            <button
              type="button"
              onClick={onSaveDraft}
              className="gs-btn gs-btn-ghost gs-btn-sm"
              title="Save temporary draft in your browser for 30 days"
              style={{ color: 'var(--gs-forest)', borderColor: 'var(--gs-sand-dark)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="gs-btn gs-btn-ghost gs-btn-sm"
              title="Copy shareable link"
              style={{ color: 'var(--gs-forest)', borderColor: 'var(--gs-sand-dark)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              type="button"
              onClick={onRequestQuote}
              disabled={submittingQuote}
              className="gs-btn-orange"
              style={{ padding: '10px 22px', fontSize: '0.9rem' }}
            >
              {submittingQuote ? (
                <>
                  <span className="gs-spinner" /> Submitting…
                </>
              ) : (
                'Request Final Quotation ➔'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
