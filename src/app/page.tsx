'use client';
// src/app/page.tsx
// Grafton Safaris — Master Interactive Trip Planning & Customization Application
// Supports Route 1 ("Recommend a safari"), Route 2 ("Customize this trip"),
// 3-way side-by-side comparison, and 30-day anonymous draft restoration.

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SAFARI_PACKAGES, SafariPackage } from '@/data/packages';
import { getSavedDrafts, SavedItineraryDraft, removeItineraryDraft } from '@/lib/draftStorage';
import DiscoveryFilterDrawer, { DiscoveryFilterState } from '@/components/filter/DiscoveryFilterDrawer';
import ItineraryBuilder from '@/components/builder/ItineraryBuilder';
import ItineraryCompareModal from '@/components/comparison/ItineraryCompareModal';

function SafariPlannerApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('package');
  const leadId = searchParams.get('leadId') || undefined;
  const tierParam = searchParams.get('tier') as 'Comfort' | 'Signature' | 'Reserve' | null;
  const adultsParam = searchParams.get('adults');
  const childrenParam = searchParams.get('children');
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');
  const openPlanParam = searchParams.get('openPlan') || searchParams.get('plan');
  const addonsParam = searchParams.get('addons');
  const singleRoomParam = searchParams.get('singleRoom') || searchParams.get('singleRooms');

  const parsedAddonIds = addonsParam ? addonsParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const parsedSingleRooms = singleRoomParam === '1' || singleRoomParam === 'true' ? 1 : singleRoomParam ? parseInt(singleRoomParam, 10) : undefined;

  // Selected package for direct customization
  const [selectedPackage, setSelectedPackage] = useState<SafariPackage | null>(null);
  const [activeDraft, setActiveDraft] = useState<SavedItineraryDraft | null>(null);
  const [autoOpenModal, setAutoOpenModal] = useState<boolean>(openPlanParam === 'true' || openPlanParam === '1');

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

  // Prevent background page scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen = showCompareModal || showDraftsDrawer;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showCompareModal, showDraftsDrawer]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleCompare = (pkg: SafariPackage) => {
    if (comparedPackageIds.includes(pkg.id)) {
      setComparedPackageIds((prev) => prev.filter((id) => id !== pkg.id));
    } else {
      if (comparedPackageIds.length >= 3) {
        setToastMessage('You can compare up to 3 journeys simultaneously. Remove one to add another.');
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
      setComparedPackageIds((prev) => [...prev, pkg.id]);
    }
  };

  const comparedPackages = SAFARI_PACKAGES.filter((p) => comparedPackageIds.includes(p.id));

  const handleRestoreDraft = (draft: SavedItineraryDraft) => {
    const pkg = SAFARI_PACKAGES.find((p) => p.id === draft.packageId);
    if (pkg) {
      setActiveDraft(draft);
      setAutoOpenModal(true);
      setSelectedPackage(pkg);
      setShowDraftsDrawer(false);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    removeItineraryDraft(draftId);
    setSavedDrafts(getSavedDrafts());
  };

  // Home active tab state
  const [homeTab, setHomeTab] = useState<'results' | 'filters'>('results');

  return (
    <div className="gs-app-shell">
      {/* ── Main Content Area (Clean Embedded iframe Layout) ───────────── */}
      <main style={{ flex: 1, padding: selectedPackage ? '16px 20px' : '20px 24px 60px' }}>
        {selectedPackage ? (
          /* Route 2: Direct Interactive Itinerary Builder */
          <ItineraryBuilder
            packageData={selectedPackage}
            onBackToCatalogue={() => {
              setSelectedPackage(null);
              setActiveDraft(null);
              setAutoOpenModal(false);
              router.replace('/');
            }}
            initialLeadId={leadId}
            initialFilters={filters}
            initialAdults={activeDraft?.adults || (adultsParam ? parseInt(adultsParam, 10) : undefined)}
            initialChildren={activeDraft?.children ?? (childrenParam ? parseInt(childrenParam, 10) : undefined)}
            initialSingleRooms={activeDraft?.rooms?.singleRooms ?? parsedSingleRooms}
            initialTier={activeDraft?.accommodationTier || tierParam || undefined}
            initialTravelDate={activeDraft?.travelDate || dateParam || undefined}
            initialTravelMonth={activeDraft?.travelMonth || monthParam || undefined}
            initialAddonIds={activeDraft?.selectedAddonIds || parsedAddonIds}
            autoOpenPlanModal={autoOpenModal}
          />
        ) : (
          /* Route 1: Discovery & Ranked Recommendations Catalog */
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {/* ── Hero Section with Centered Attached Capsule Switcher ── */}
            <section className="gs-hero-quick-search-section">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span className="gs-badge-olive" style={{ marginBottom: '10px' }}>Custom Safaris Just For You</span>
                <h1 className="gs-the-grafton-heading">
                  The Grafton <span className="gs-italic-olive">Experience</span>
                </h1>
                <p style={{ maxWidth: '620px', margin: '8px auto 0', fontSize: '1.02rem', color: 'var(--gs-text-muted)', lineHeight: 1.5 }}>
                  Handcrafted private safaris, prime migration camps, and untouched wilderness journeys across Tanzania.
                </p>

                {/* Centered Attached Capsule Buttons */}
                <div className="gs-hero-capsule-wrap">
                  <div className="gs-hero-capsule-container">
                    <button
                      type="button"
                      onClick={() => setHomeTab('results')}
                      className={`gs-hero-capsule-btn${homeTab === 'results' ? ' active' : ''}`}
                    >
                      Explore 8 Curated Journeys ➔
                    </button>
                    <button
                      type="button"
                      onClick={() => setHomeTab('filters')}
                      className={`gs-hero-capsule-btn${homeTab === 'filters' ? ' active' : ''}`}
                    >
                      Recommend a Custom Safari ➔
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 8 Packages Catalog & Filter Drawer ── */}
            <div style={{ marginTop: '28px' }}>
              <DiscoveryFilterDrawer
                filters={filters}
                onChange={setFilters}
                onSelectPackage={(pkg) => {
                  setAutoOpenModal(false);
                  setSelectedPackage(pkg);
                }}
                onComparePackage={handleToggleCompare}
                comparedPackageIds={comparedPackageIds}
                activeTab={homeTab}
                onTabChange={setHomeTab}
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
            setAutoOpenModal(false);
            setSelectedPackage(pkg);
            setShowCompareModal(false);
          }}
          onRemoveFromCompare={(pkgId) =>
            setComparedPackageIds((prev) => prev.filter((id) => id !== pkgId))
          }
        />
      )}

      {/* ── Vertical Floating Comparison Action Panel (Right Side) ─────── */}
      {comparedPackageIds.length > 0 && !selectedPackage && !showCompareModal && (
        <aside className="gs-compare-vertical-dock" role="status" aria-live="polite">
          {/* Dock Header */}
          <div className="gs-compare-dock-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="gs-compare-dock-title">Compare</span>
              <span className="gs-compare-dock-count-badge">
                {comparedPackageIds.length}/3
              </span>
            </div>
            <button
              type="button"
              onClick={() => setComparedPackageIds([])}
              className="gs-compare-dock-clear-btn"
              title="Clear all"
            >
              Clear
            </button>
          </div>

          {/* List of Selected Journeys (Vertical Stack) */}
          <div className="gs-compare-dock-list">
            {comparedPackages.map((pkg) => (
              <div key={pkg.id} className="gs-compare-dock-item">
                <img src={pkg.heroImage} alt={pkg.title} className="gs-compare-dock-thumb" />
                <div className="gs-compare-dock-info">
                  <span className="gs-compare-dock-pkg-title">{pkg.title}</span>
                  <span className="gs-compare-dock-pkg-sub">{pkg.durationDays}D · ${pkg.basePriceComfort.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setComparedPackageIds((prev) => prev.filter((id) => id !== pkg.id))}
                  className="gs-compare-dock-remove"
                  aria-label={`Remove ${pkg.title}`}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Guidance Message */}
          <div className="gs-compare-dock-hint">
            {comparedPackageIds.length === 1 ? (
              <span>Select 1 more journey to compare side-by-side</span>
            ) : (
              <span>Ready for side-by-side comparison</span>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="gs-compare-dock-actions">
            {comparedPackageIds.length >= 2 ? (
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="gs-btn-orange gs-btn-full"
                style={{ padding: '9px 12px', fontSize: '0.82rem' }}
              >
                Compare ({comparedPackageIds.length}) ➔
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="gs-btn gs-btn-full"
                style={{
                  padding: '9px 12px',
                  fontSize: '0.8rem',
                  background: 'rgba(20, 40, 32, 0.08)',
                  color: 'var(--gs-text-muted)',
                  cursor: 'default',
                  border: '1px solid rgba(20, 40, 32, 0.1)',
                }}
              >
                Select 1 More
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Saved Drafts Drawer ─────────────────────────────────── */}
      {showDraftsDrawer && (
        <div className="gs-modal-backdrop" onClick={() => setShowDraftsDrawer(false)}>
          <div
            className="gs-modal-quote-container"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gs-modal-header">
              <div>
                <h2>Saved Safari Drafts</h2>
                <p>Saved in your browser for 30 days. Resume planning anytime.</p>
              </div>
              <button onClick={() => setShowDraftsDrawer(false)} className="gs-modal-close-btn" aria-label="Close">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedDrafts.length === 0 ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', textAlign: 'center', padding: '24px 0' }}>
                  No saved drafts yet.
                </p>
              ) : (
                savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    style={{
                      background: 'var(--gs-sand)',
                      border: '1px solid var(--gs-sand-dark)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 2px', color: 'var(--gs-forest)', fontSize: '0.96rem' }}>{draft.packageTitle}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                        {draft.adults} Adults · {draft.accommodationTier} Standard · {draft.travelMonth || 'Flexible'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--gs-forest)', fontWeight: 600, marginTop: '2px' }}>
                        {draft.indicativePricePerPerson ? `$${draft.indicativePricePerPerson.toLocaleString()} pp` : 'Price on request'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleRestoreDraft(draft)}
                        className="gs-btn gs-btn-orange gs-btn-sm"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="gs-btn gs-btn-ghost gs-btn-sm"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="Delete draft"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Elegant Toast Notification ──────────────────────────────────── */}
      {toastMessage && (
        <div className="gs-toast-notification" role="alert">
          <span className="gs-toast-icon">ℹ</span>
          <span className="gs-toast-text">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="gs-toast-close"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
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
