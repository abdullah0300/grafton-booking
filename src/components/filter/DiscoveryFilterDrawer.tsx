'use client';
// src/components/filter/DiscoveryFilterDrawer.tsx
// Comprehensive Multi-Select Discovery & Filter Engine for Grafton Safaris
// Supports Route 1 ("Recommend a Safari") and live search filtering across all 14 criteria.

import { useState, useMemo } from 'react';
import { SAFARI_PACKAGES, SafariPackage } from '@/data/packages';

export interface DiscoveryFilterState {
  datesNotDecided: boolean;
  startDate?: string;
  endDate?: string;
  travelMonth?: string;
  seasons: string[];
  regions: string[];
  travellerTypes: string[];
  adults: number;
  children: number;
  childAges: number[];
  durationRanges: string[];
  comfortLevels: string[];
  interests: string[];
  transportPreferences: string[];
  pacePreferences: string[];
  budgetPerPerson?: number;
  accessibilityNotes?: string;
}

interface DiscoveryFilterDrawerProps {
  filters: DiscoveryFilterState;
  onChange: (filters: DiscoveryFilterState) => void;
  onSelectPackage: (pkg: SafariPackage) => void;
  onComparePackage?: (pkg: SafariPackage) => void;
  comparedPackageIds?: number[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SEASONS = [
  { id: 'Migration Season', label: 'Migration Season (Jul–Oct River Crossings)' },
  { id: 'Calving Season', label: 'Calving Season (Jan–Mar Ndutu Newborns)' },
  { id: 'Peak', label: 'Peak Dry Season (Jun–Oct Prime Game)' },
  { id: 'Shoulder', label: 'Shoulder Season (Warm & Balanced)' },
  { id: 'Green', label: 'Green Season (Emerald Plains & Great Value)' },
];

const REGIONS = [
  { id: 'Northern Circuit', label: 'Northern Circuit (Serengeti, Ngorongoro, Tarangire)' },
  { id: 'Southern Tanzania', label: 'Southern Tanzania (Ruaha & Nyerere Wilderness)' },
  { id: 'Western Tanzania', label: 'Western Tanzania (Katavi & Mahale Chimps)' },
  { id: 'Zanzibar/Coast', label: 'Zanzibar & Spice Island Coast' },
  { id: 'Kilimanjaro', label: 'Kilimanjaro Summit Routes' },
];

const TRAVELLER_TYPES = [
  'Solo', 'Couple', 'Honeymoon', 'Family',
  'Friends/Private Group', 'Multigenerational', 'Small Group', 'Climber/Adventure',
];

const DURATION_RANGES = [
  { id: '4-6', label: '4–6 Days (Efficient Highlights)' },
  { id: '7-9', label: '7–9 Days (Classic Circuit)' },
  { id: '10-12', label: '10–12 Days (In-Depth Safari + Beach)' },
  { id: '13-16', label: '13–16 Days (Grand Expedition)' },
];

const COMFORT_LEVELS = [
  { id: 'Comfort', label: 'Comfort (Quality mid-range lodges, private 4x4)' },
  { id: 'Signature', label: 'Signature (Intimate luxury character camps, fly-in sectors)' },
  { id: 'Reserve', label: 'Reserve (Pinnacle private villas & crater-rim sanctuaries)' },
];

const INTERESTS = [
  'Big Five', 'Migration', 'Calving', 'Photography', 'Culture', 'Walking',
  'Balloon Safari', 'Beach', 'Diving/Snorkelling', 'Kilimanjaro', 'Chimpanzees', 'Remote Wilderness',
];

const TRANSPORTS = [
  'Primarily road', 'Road plus selected flights', 'Fly-in safari',
];

const PACES = ['Relaxed', 'Balanced', 'Active'];

export default function DiscoveryFilterDrawer({
  filters,
  onChange,
  onSelectPackage,
  onComparePackage,
  comparedPackageIds = [],
}: DiscoveryFilterDrawerProps) {
  const [activeTab, setActiveTab] = useState<'filters' | 'results'>('results');

  const toggleArrayItem = (key: keyof DiscoveryFilterState, value: string) => {
    const list = (filters[key] as string[]) || [];
    const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    onChange({ ...filters, [key]: next });
  };

  // ── Ranked Recommendation Scoring Engine ────────────────────────────────
  const rankedResults = useMemo(() => {
    return SAFARI_PACKAGES.map((pkg) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Region match
      if (filters.regions.length > 0) {
        const matchesRegion = filters.regions.some((r) => pkg.tags.regions.includes(r as any));
        if (matchesRegion) {
          score += 30;
          reasons.push(`Explores your preferred region: ${filters.regions.join(', ')}`);
        }
      }

      // 2. Traveller Type match
      if (filters.travellerTypes.length > 0) {
        const matchesTraveller = filters.travellerTypes.some((t) => pkg.tags.travellerTypes.includes(t as any));
        if (matchesTraveller) {
          score += 25;
          reasons.push(`Designed specifically for ${filters.travellerTypes.join(', ')} travellers`);
        }
      }

      // 3. Month & Season match
      if (filters.travelMonth) {
        const monthMatch = pkg.bestMonths.some((m) =>
          m.toLowerCase().includes(filters.travelMonth!.toLowerCase()) || m.includes('All Year')
        );
        if (monthMatch) {
          score += 20;
          reasons.push(`Prime travel window in ${filters.travelMonth}`);
        }
      }
      if (filters.seasons.length > 0) {
        const seasonMatch = filters.seasons.some((s) => pkg.tags.seasons.includes(s as any));
        if (seasonMatch) {
          score += 15;
          reasons.push(`Matches ${filters.seasons.join(', ')} requirements`);
        }
      }

      // 4. Duration match
      if (filters.durationRanges.length > 0) {
        const matchesDuration = filters.durationRanges.some((range) => {
          if (range === '4-6') return pkg.durationDays >= 4 && pkg.durationDays <= 6;
          if (range === '7-9') return pkg.durationDays >= 7 && pkg.durationDays <= 9;
          if (range === '10-12') return pkg.durationDays >= 10 && pkg.durationDays <= 12;
          if (range === '13-16') return pkg.durationDays >= 13 && pkg.durationDays <= 16;
          return true;
        });
        if (matchesDuration) {
          score += 15;
          reasons.push(`Fits your ${pkg.durationDays}-day timeframe perfectly`);
        }
      }

      // 5. Interests match
      if (filters.interests.length > 0) {
        const matchedInterests = filters.interests.filter((i) => pkg.tags.interests.includes(i));
        if (matchedInterests.length > 0) {
          score += matchedInterests.length * 10;
          reasons.push(`Features your key interests: ${matchedInterests.join(', ')}`);
        }
      }

      // 6. Transport & Pace match
      if (filters.transportPreferences.length > 0 && filters.transportPreferences.includes(pkg.tags.transportPreference)) {
        score += 10;
        reasons.push(`Uses your preferred transport: ${pkg.tags.transportPreference}`);
      }
      if (filters.pacePreferences.length > 0 && filters.pacePreferences.includes(pkg.tags.pace)) {
        score += 10;
        reasons.push(`Paced to your ${pkg.tags.pace} rhythm`);
      }

      // Check if this package should be included
      const hasActiveFilters =
        filters.regions.length > 0 ||
        filters.interests.length > 0 ||
        filters.seasons.length > 0 ||
        filters.durationRanges.length > 0 ||
        filters.travellerTypes.length > 0;

      // If hard region filter is set and package doesn't match, exclude it
      if (filters.regions.length > 0 && !filters.regions.some((r) => pkg.tags.regions.includes(r as any))) {
        return null;
      }

      // If hard duration filter is set and package doesn't match, exclude it
      if (filters.durationRanges.length > 0) {
        const matchesDuration = filters.durationRanges.some((range) => {
          if (range === '4-6') return pkg.durationDays >= 4 && pkg.durationDays <= 6;
          if (range === '7-9') return pkg.durationDays >= 7 && pkg.durationDays <= 9;
          if (range === '10-12') return pkg.durationDays >= 10 && pkg.durationDays <= 12;
          if (range === '13-16') return pkg.durationDays >= 13 && pkg.durationDays <= 16;
          return true;
        });
        if (!matchesDuration) return null;
      }

      // Default reason if empty
      if (reasons.length === 0) {
        reasons.push(`${pkg.strategicJob} signature itinerary across ${pkg.routeString}`);
      }

      return {
        pkg,
        score: Math.max(score, hasActiveFilters ? score : 60),
        reasons: reasons.slice(0, 3),
      };
    })
      .filter((item): item is { pkg: SafariPackage; score: number; reasons: string[] } => item !== null)
      .sort((a, b) => b.score - a.score);
  }, [filters]);

  return (
    <div className="gs-discovery-engine">
      {/* View Switcher Bar */}
      <div className="gs-filter-tabs-header">
        <button
          onClick={() => setActiveTab('results')}
          className={`gs-tab-btn${activeTab === 'results' ? ' active' : ''}`}
        >
          ✨ Recommended Journeys ({rankedResults.length})
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`gs-tab-btn${activeTab === 'filters' ? ' active' : ''}`}
        >
          ⚙ Customize Trip Filters
          {(filters.regions.length > 0 || filters.interests.length > 0 || filters.seasons.length > 0) && (
            <span className="gs-tab-count">
              {filters.regions.length + filters.interests.length + filters.seasons.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab 1: Comprehensive Filter Controls ────────────────────────── */}
      {activeTab === 'filters' && (
        <div className="gs-filter-form-panel">
          <div className="gs-filter-grid">
            {/* Travel Month & Dates */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">🗓 When Would You Like to Travel?</label>
              <div className="gs-pill-cluster">
                {MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChange({ ...filters, travelMonth: filters.travelMonth === m ? undefined : m })}
                    className={`gs-filter-pill${filters.travelMonth === m ? ' active' : ''}`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '12px' }}>
                <label className="gs-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.datesNotDecided}
                    onChange={(e) => onChange({ ...filters, datesNotDecided: e.target.checked })}
                  />
                  <span>Dates not yet decided (Flexible year)</span>
                </label>
              </div>
            </div>

            {/* Traveller Type */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">👥 Who Is Traveling?</label>
              <div className="gs-pill-cluster">
                {TRAVELLER_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleArrayItem('travellerTypes', t)}
                    className={`gs-filter-pill${filters.travellerTypes.includes(t) ? ' active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="gs-guest-counter-row" style={{ marginTop: '16px' }}>
                <div className="gs-counter-box">
                  <span>Adults (12+)</span>
                  <div className="gs-stepper">
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, adults: Math.max(1, filters.adults - 1) })}
                    >
                      -
                    </button>
                    <strong>{filters.adults}</strong>
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, adults: filters.adults + 1 })}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="gs-counter-box">
                  <span>Children (&lt;12)</span>
                  <div className="gs-stepper">
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, children: Math.max(0, filters.children - 1) })}
                    >
                      -
                    </button>
                    <strong>{filters.children}</strong>
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, children: filters.children + 1 })}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Child Ages Inputs */}
              {filters.children > 0 && (
                <div style={{ marginTop: '12px', background: 'var(--gs-white)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gs-sand-dark)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gs-forest)', display: 'block', marginBottom: '8px' }}>
                    Age of each child at travel (for park permits & room configurations):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                    {Array.from({ length: filters.children }).map((_, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)' }}>Child {idx + 1} Age</span>
                        <input
                          type="number"
                          min={1}
                          max={17}
                          className="gs-input"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          value={filters.childAges[idx] ?? 8}
                          onChange={(e) => {
                            const newAges = [...filters.childAges];
                            newAges[idx] = parseInt(e.target.value, 10) || 0;
                            onChange({ ...filters, childAges: newAges });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Region Preference */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">📍 Preferred Safari Regions</label>
              <div className="gs-filter-checkbox-list">
                {REGIONS.map((r) => (
                  <label key={r.id} className="gs-checkbox-row">
                    <input
                      type="checkbox"
                      checked={filters.regions.includes(r.id)}
                      onChange={() => toggleArrayItem('regions', r.id)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Interests */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">🦁 Signature Experiences</label>
              <div className="gs-pill-cluster">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleArrayItem('interests', interest)}
                    className={`gs-filter-pill${filters.interests.includes(interest) ? ' active' : ''}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Range */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">⏳ Preferred Duration</label>
              <div className="gs-filter-checkbox-list">
                {DURATION_RANGES.map((d) => (
                  <label key={d.id} className="gs-checkbox-row">
                    <input
                      type="checkbox"
                      checked={filters.durationRanges.includes(d.id)}
                      onChange={() => toggleArrayItem('durationRanges', d.id)}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comfort Level */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">🏕 Accommodation Tier</label>
              <div className="gs-filter-checkbox-list">
                {COMFORT_LEVELS.map((c) => (
                  <label key={c.id} className="gs-checkbox-row">
                    <input
                      type="checkbox"
                      checked={filters.comfortLevels.includes(c.id)}
                      onChange={() => toggleArrayItem('comfortLevels', c.id)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transport & Pace Preferences */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">✈️ Transport & Pace Preference</label>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)', display: 'block', marginBottom: '6px' }}>Transport Style:</span>
                <div className="gs-pill-cluster">
                  {TRANSPORTS.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => toggleArrayItem('transportPreferences', tp)}
                      className={`gs-filter-pill${filters.transportPreferences.includes(tp) ? ' active' : ''}`}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)', display: 'block', marginBottom: '6px' }}>Trip Pace:</span>
                <div className="gs-pill-cluster">
                  {PACES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArrayItem('pacePreferences', p)}
                      className={`gs-filter-pill${filters.pacePreferences.includes(p) ? ' active' : ''}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Indicative Budget & Special Requirements */}
            <div className="gs-filter-card">
              <label className="gs-filter-title">💳 Indicative Budget & Accessibility</label>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Max Budget / Person:</span>
                  <strong>{filters.budgetPerPerson ? `$${filters.budgetPerPerson.toLocaleString()}` : 'Flexible'}</strong>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={12000}
                  step={500}
                  value={filters.budgetPerPerson || 8000}
                  onChange={(e) => onChange({ ...filters, budgetPerPerson: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', accentColor: 'var(--gs-forest)' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Accessibility / Special Requirements:
                </span>
                <input
                  type="text"
                  className="gs-input"
                  style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                  placeholder="Dietary requirements, limited mobility, cpap machine…"
                  value={filters.accessibilityNotes || ''}
                  onChange={(e) => onChange({ ...filters, accessibilityNotes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="gs-filter-submit-bar">
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className="gs-btn gs-btn-gold gs-btn-lg"
            >
              View {rankedResults.length} Matched Journeys ➔
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 2: Ranked Recommendations Catalog ──────────────────────── */}
      {activeTab === 'results' && (
        <div className="gs-ranked-results-grid">
          {rankedResults.map(({ pkg, score, reasons }) => {
            const isCompared = comparedPackageIds.includes(pkg.id);

            return (
              <div key={pkg.id} className="gs-luxury-safari-card">
                {/* Left Side: Details, Metadata, and CTAs (Image 2 format) */}
                <div className="gs-card-content-col">
                  <div>
                    <h3 className="gs-card-title">{pkg.title}</h3>
                    <div className="gs-card-price-row">
                      <span>from</span>
                      <strong>${pkg.basePriceComfort.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* 4 Clean Metadata Rows (Image 2 style) */}
                  <div className="gs-card-meta-list">
                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span>{pkg.route.slice(0, 4).join(' · ')}{pkg.route.length > 4 ? ` · ${pkg.route[pkg.route.length - 1]}` : ''}</span>
                    </div>

                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="18" y2="10" />
                      </svg>
                      <span>{pkg.bestMonths.slice(0, 2).join(', ')} ({pkg.durationDays} days, {pkg.durationNights} nights)</span>
                    </div>

                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>2 to 6 guests · {pkg.tags.transportPreference}</span>
                    </div>

                    <div className="gs-card-meta-trust">
                      <span>Trusted by 190+ clients worldwide</span>
                      <span className="gs-trust-stars">★★★★★</span>
                    </div>
                  </div>

                  {/* Why this matches you if user selected filters */}
                  {score > 60 && reasons.length > 0 && (
                    <div className="gs-card-match-pill">
                      <span>✓ {reasons[0]}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="gs-card-footer-actions">
                    <button
                      type="button"
                      onClick={() => onSelectPackage(pkg)}
                      className="gs-btn-explore-pill"
                    >
                      Explore Journey ➔
                    </button>

                    {onComparePackage && (
                      <button
                        type="button"
                        onClick={() => onComparePackage(pkg)}
                        className={`gs-btn-compare-pill${isCompared ? ' active' : ''}`}
                        title="Compare itineraries side-by-side"
                      >
                        {isCompared ? '✓ Added' : 'Compare'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Guaranteed Square 1:1 Visual (Image 2 style) */}
                <div className="gs-card-media-square">
                  <img
                    src={pkg.heroImage}
                    alt={pkg.title}
                    className="gs-square-photo"
                    loading="lazy"
                  />
                  <span className="gs-square-badge">
                    {pkg.tags.seasons[0] || 'Signature'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
