'use client';
// src/app/page.tsx
// Grafton Safaris — Master Interactive Trip Planning & Customization Application
// Supports Route 1 ("Recommend a safari"), Route 2 ("Customize this trip"),
// 3-way side-by-side comparison, and 30-day anonymous draft restoration.

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SAFARI_PACKAGES, SafariPackage } from '@/data/packages';
import { getSavedDrafts, SavedItineraryDraft, removeItineraryDraft } from '@/lib/draftStorage';
import DiscoveryFilterDrawer, { DiscoveryFilterState } from '@/components/filter/DiscoveryFilterDrawer';
import ItineraryBuilder from '@/components/builder/ItineraryBuilder';
import ItineraryCompareModal from '@/components/comparison/ItineraryCompareModal';

function SafariPlannerApp() {
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('package');
  const leadId = searchParams.get('leadId') || undefined;

  // Selected package for direct customization
  const [selectedPackage, setSelectedPackage] = useState<SafariPackage | null>(null);

  // Compared packages (up to 3)
  const [comparedPackageIds, setComparedPackageIds] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Saved Drafts Drawer
  const [showDraftsDrawer, setShowDraftsDrawer] = useState<boolean>(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedItineraryDraft[]>([]);

  // Discovery Filter State
  const [filters, setFilters] = useState<DiscoveryFilterState>({
    datesNotDecided: false,
    seasons: [],
    regions: [],
    travellerTypes: [],
    adults: 2,
    children: 0,
    childAges: [],
    durationRanges: [],
    comfortLevels: [],
    interests: [],
    transportPreferences: [],
    pacePreferences: [],
  });

  // On initial load, inspect URL params
  useEffect(() => {
    if (packageParam) {
      const pId = parseInt(packageParam, 10);
      const matched = SAFARI_PACKAGES.find((p) => p.id === pId);
      if (matched) {
        setSelectedPackage(matched);
      }
    }
  }, [packageParam]);

  // Load saved drafts on mount
  useEffect(() => {
    setSavedDrafts(getSavedDrafts());
  }, []);

  const handleToggleCompare = (pkg: SafariPackage) => {
    if (comparedPackageIds.includes(pkg.id)) {
      setComparedPackageIds((prev) => prev.filter((id) => id !== pkg.id));
    } else {
      if (comparedPackageIds.length >= 3) {
        alert('You can compare up to 3 itineraries simultaneously.');
        return;
      }
      setComparedPackageIds((prev) => [...prev, pkg.id]);
    }
  };

  const comparedPackages = SAFARI_PACKAGES.filter((p) => comparedPackageIds.includes(p.id));

  const handleRestoreDraft = (draft: SavedItineraryDraft) => {
    const pkg = SAFARI_PACKAGES.find((p) => p.id === draft.packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setShowDraftsDrawer(false);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    removeItineraryDraft(draftId);
    setSavedDrafts(getSavedDrafts());
  };

  // Quick Adventure Widget State (Image 1)
  const [quickName, setQuickName] = useState<string>('');
  const [quickPackageId, setQuickPackageId] = useState<number>(1);
  const [quickDate, setQuickDate] = useState<string>('');

  const handleQuickCustomize = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = SAFARI_PACKAGES.find((p) => p.id === quickPackageId) || SAFARI_PACKAGES[0];
    if (quickDate) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const parsedMonth = monthNames[new Date(quickDate).getMonth()];
      setFilters((prev) => ({ ...prev, travelMonth: parsedMonth }));
    }
    setSelectedPackage(pkg);
  };

  return (
    <div className="gs-app-shell">
      {/* ── Main Content Area (Clean Embedded iframe Layout) ───────────── */}
      <main style={{ flex: 1, padding: selectedPackage ? '16px 20px' : '20px 24px 60px' }}>
        {selectedPackage ? (
          /* Route 2: Direct Interactive Itinerary Builder */
          <ItineraryBuilder
            packageData={selectedPackage}
            onBackToCatalogue={() => setSelectedPackage(null)}
            initialLeadId={leadId}
            initialFilters={filters}
          />
        ) : (
          /* Route 1: Discovery & Ranked Recommendations Catalog */
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {/* ── Hero & Floating "Start your adventure here" (Image 1) ── */}
            <section className="gs-hero-quick-search-section" id="quick-search-widget">
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span className="gs-badge-olive" style={{ marginBottom: '10px' }}>Custom Safaris Just For You</span>
                <h1 className="gs-the-grafton-heading">
                  The Grafton <span className="gs-italic-olive">Experience</span>
                </h1>
                <p style={{ maxWidth: '580px', margin: '8px auto 0', fontSize: '1rem', color: 'var(--gs-text-muted)' }}>
                  Handcrafted private safaris, prime migration camps, and untouched wilderness journeys across Tanzania.
                </p>
              </div>

              {/* Floating Quick Search Card */}
              <div className="gs-quick-search-card">
                <h3 className="gs-quick-search-title">Start your adventure here</h3>
                <form className="gs-quick-search-form" onSubmit={handleQuickCustomize}>
                  <div className="gs-quick-field">
                    <label className="gs-quick-field-label">Full Name*</label>
                    <input
                      type="text"
                      className="gs-quick-input"
                      placeholder="Full name…"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                    />
                  </div>

                  <div className="gs-quick-field">
                    <label className="gs-quick-field-label">Choose Your Adventure*</label>
                    <select
                      className="gs-quick-select"
                      value={quickPackageId}
                      onChange={(e) => setQuickPackageId(parseInt(e.target.value, 10))}
                    >
                      {SAFARI_PACKAGES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.durationDays} Days) — from ${p.basePriceComfort.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="gs-quick-field">
                    <label className="gs-quick-field-label">Arrival Date*</label>
                    <input
                      type="date"
                      className="gs-quick-input"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="gs-quick-submit-btn">
                    Customize ➔
                  </button>
                </form>
              </div>
            </section>

            {/* ── 8 Packages Catalog (Split 2-Column Cards from Image 2) ── */}
            <div style={{ marginTop: '36px' }}>
              <DiscoveryFilterDrawer
                filters={filters}
                onChange={setFilters}
                onSelectPackage={(pkg) => setSelectedPackage(pkg)}
                onComparePackage={handleToggleCompare}
                comparedPackageIds={comparedPackageIds}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Comparison Modal ──────────────────────────────────────────── */}
      {showCompareModal && (
        <ItineraryCompareModal
          packages={comparedPackages}
          onClose={() => setShowCompareModal(false)}
          onSelectForCustomize={(pkg) => {
            setSelectedPackage(pkg);
            setShowCompareModal(false);
          }}
          onRemoveFromCompare={(pkgId) =>
            setComparedPackageIds((prev) => prev.filter((id) => id !== pkgId))
          }
        />
      )}

      {/* ── 30-Day Saved Drafts Drawer ─────────────────────────────────── */}
      {showDraftsDrawer && (
        <div className="gs-modal-backdrop" onClick={() => setShowDraftsDrawer(false)}>
          <div
            className="gs-modal-quote-container"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gs-modal-header">
              <div>
                <span className="gs-badge-gold">30-Day Local Storage</span>
                <h2>Your Saved Safari Drafts</h2>
                <p>Saved anonymously in your browser. Re-open and customize anytime.</p>
              </div>
              <button onClick={() => setShowDraftsDrawer(false)} className="gs-modal-close-btn">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  style={{
                    background: 'var(--gs-sand)',
                    border: '1px solid var(--gs-sand-dark)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px', color: 'var(--gs-forest)' }}>{draft.packageTitle}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                      {draft.adults} Adults · {draft.accommodationTier} Tier · {draft.travelMonth || 'Flexible'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gs-gold-dark)', marginTop: '4px' }}>
                      Indicative: {draft.indicativePricePerPerson ? `$${draft.indicativePricePerPerson.toLocaleString()} pp` : 'Price to be reviewed'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleRestoreDraft(draft)}
                      className="gs-btn gs-btn-gold gs-btn-sm"
                    >
                      Open ➔
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="gs-btn gs-btn-ghost gs-btn-sm"
                      title="Delete draft"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Master Editorial Footer ───────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--gs-obsidian)',
          color: 'rgba(255,255,255,0.6)',
          borderTop: '1px solid rgba(212, 175, 107, 0.2)',
          padding: '36px 24px',
          textAlign: 'center',
          fontSize: '0.85rem',
        }}
      >
        <p>
          © {new Date().getFullYear()} Grafton Safaris & Travel Management Ltd ·{' '}
          <a
            href="mailto:gstt@graftonsafaris.com"
            style={{ color: 'var(--gs-gold)', textDecoration: 'none' }}
          >
            gstt@graftonsafaris.com
          </a>
        </p>
        <p style={{ marginTop: '8px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)' }}>
          Luxury Private Safaris · Kilimanjaro Treks · Northern, Southern & Western Tanzania Circuits
        </p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0D1B15', color: '#D4AF6B' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="gs-spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem' }}>
              Loading Grafton Safaris Portfolio…
            </p>
          </div>
        </div>
      }
    >
      <SafariPlannerApp />
    </Suspense>
  );
}
