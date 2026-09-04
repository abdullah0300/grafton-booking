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
  activeTab?: 'filters' | 'results';
  onTabChange?: (tab: 'filters' | 'results') => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SEASONS = [
  { id: 'Green', label: 'Green Season (Emerald Plains & Great Value)' },
  { id: 'Shoulder', label: 'Shoulder Season (Warm & Balanced)' },
  { id: 'Peak', label: 'Peak Dry Season (Jun–Oct Prime Game)' },
  { id: 'Calving Season', label: 'Calving Season (Jan–Mar Ndutu Newborns)' },
  { id: 'Migration Season', label: 'Migration Season (Jul–Oct River Crossings)' },
];

const REGIONS = [
  { id: 'Northern Circuit', label: 'Northern Circuit (Serengeti, Ngorongoro, Tarangire)' },
  { id: 'Southern Tanzania', label: 'Southern Tanzania (Ruaha & Nyerere Wilderness)' },
  { id: 'Western Tanzania', label: 'Western Tanzania (Katavi & Mahale Chimps)' },
  { id: 'Zanzibar/Coast', label: 'Zanzibar & Coast' },
  { id: 'Kilimanjaro', label: 'Kilimanjaro' },
  { id: 'Multi-region', label: 'Multi-Region (Combined Circuit & Fly-in)' },
];

const TRAVELLER_TYPES = [
  'Solo', 'Couple', 'Honeymoon', 'Family',
  'Friends/Private Group', 'Multigenerational', 'Small Group', 'Climber/Adventure',
];

const DURATION_RANGES = [
  { id: '4-6', label: '4–6 Days' },
  { id: '7-9', label: '7–9 Days' },
  { id: '10-12', label: '10–12 Days' },
  { id: '13-16', label: '13–16 Days' },
  { id: '17+', label: '17+ Days' },
];

const COMFORT_LEVELS = [
  { id: 'Comfort', label: 'Comfort (Mid-range lodges, private 4x4)' },
  { id: 'Signature', label: 'Signature (Intimate luxury camps, fly-in sectors)' },
  { id: 'Reserve', label: 'Reserve (Pinnacle private sanctuaries & crater-rim)' },
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
  activeTab: controlledActiveTab,
  onTabChange,
}: DiscoveryFilterDrawerProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'filters' | 'results'>('results');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: 'filters' | 'results') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

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
        const matchesRegion = filters.regions.some((r) =>
          r === 'Multi-region' ? pkg.tags.regions.length > 1 || pkg.tags.regions.includes('Multi-region') : pkg.tags.regions.includes(r as any)
        );
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
          if (range === '17+') return pkg.durationDays >= 17;
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

      // 7. Budget match
      if (filters.budgetPerPerson && filters.budgetPerPerson > 0) {
        if (pkg.basePriceComfort <= filters.budgetPerPerson) {
          score += 10;
        } else if (pkg.basePriceComfort > filters.budgetPerPerson * 1.25) {
          // Beyond budget threshold
          return null;
        }
      }

      // Check if this package should be included
      const hasActiveFilters =
        filters.regions.length > 0 ||
        filters.interests.length > 0 ||
        filters.seasons.length > 0 ||
        filters.durationRanges.length > 0 ||
        filters.travellerTypes.length > 0;

      // If hard region filter is set and package doesn't match, exclude it
      if (filters.regions.length > 0) {
        const matchesRegion = filters.regions.some((r) =>
          r === 'Multi-region' ? pkg.tags.regions.length > 1 || pkg.tags.regions.includes('Multi-region') : pkg.tags.regions.includes(r as any)
        );
        if (!matchesRegion) return null;
      }

      // If hard duration filter is set and package doesn't match, exclude it
      if (filters.durationRanges.length > 0) {
        const matchesDuration = filters.durationRanges.some((range) => {
          if (range === '4-6') return pkg.durationDays >= 4 && pkg.durationDays <= 6;
          if (range === '7-9') return pkg.durationDays >= 7 && pkg.durationDays <= 9;
          if (range === '10-12') return pkg.durationDays >= 10 && pkg.durationDays <= 12;
          if (range === '13-16') return pkg.durationDays >= 13 && pkg.durationDays <= 16;
          if (range === '17+') return pkg.durationDays >= 17;
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
      {/* ── Tab 1: Comprehensive Filter Controls (4 Structured Chapters) ─ */}
      {activeTab === 'filters' && (
        <div className="gs-filter-designer-panel">
          {/* Header Description */}
          <div className="gs-filter-panel-intro">
            <div>
              <span className="gs-badge-olive" style={{ marginBottom: '6px' }}>Tailored Safari Matcher</span>
              <h2 className="gs-filter-panel-headline">Curate Your Ideal Safari Criteria</h2>
              <p className="gs-filter-panel-sub">
                Select your preferred timing, party composition, and wildlife passions below. Our engine dynamically scores and ranks the best matching journeys in real-time.
              </p>
            </div>
            <div className="gs-filter-intro-stats">
              <span className="gs-filter-live-pill">
                ✨ <strong>{rankedResults.length}</strong> Journeys Matched
              </span>
            </div>
          </div>

          <div className="gs-filter-chapters-list">
            {/* ── Chapter 01: Timing, Dates & Wildlife Seasons ─────────────── */}
            <div className="gs-filter-chapter-card">
              <div className="gs-filter-chapter-header">
                <span className="gs-filter-chapter-num">01</span>
                <div>
                  <h3 className="gs-filter-chapter-title">Timing, Dates & Wildlife Seasons</h3>
                  <p className="gs-filter-chapter-desc">Specify exact travel dates, select a preferred month, or choose based on Great Migration & calving events.</p>
                </div>
              </div>

              <div className="gs-filter-chapter-body">
                {/* Dates vs Flexible Toggle */}
                <div className="gs-filter-inner-block">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="gs-filter-sublabel">Travel Dates or Preferred Month</label>
                    <label className="gs-checkbox-inline">
                      <input
                        type="checkbox"
                        checked={filters.datesNotDecided}
                        onChange={(e) => onChange({ ...filters, datesNotDecided: e.target.checked })}
                      />
                      <span>Dates not decided (Flexible)</span>
                    </label>
                  </div>

                  {!filters.datesNotDecided && (
                    <div className="gs-dates-picker-grid">
                      <div className="gs-field">
                        <span className="gs-field-tag">Arrival in Tanzania</span>
                        <input
                          type="date"
                          className="gs-input"
                          value={filters.startDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const d = new Date(val);
                              if (!isNaN(d.getTime())) {
                                onChange({
                                  ...filters,
                                  startDate: val,
                                  travelMonth: MONTHS[d.getMonth()],
                                  datesNotDecided: false,
                                });
                                return;
                              }
                            }
                            onChange({ ...filters, startDate: val || undefined });
                          }}
                        />
                      </div>
                      <div className="gs-field">
                        <span className="gs-field-tag">Departure</span>
                        <input
                          type="date"
                          className="gs-input"
                          value={filters.endDate || ''}
                          onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Month Pills Cluster */}
                  <div style={{ marginTop: '12px' }}>
                    <span className="gs-field-tag" style={{ display: 'block', marginBottom: '8px' }}>Or Preferred Travel Month:</span>
                    <div className="gs-pill-cluster">
                      {MONTHS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (filters.travelMonth === m) {
                              onChange({ ...filters, travelMonth: undefined, startDate: undefined, endDate: undefined });
                            } else {
                              const now = new Date();
                              const currentYear = now.getFullYear();
                              const currentMonthIndex = now.getMonth();
                              const monthIndex = MONTHS.indexOf(m);
                              const targetYear = monthIndex < currentMonthIndex ? currentYear + 1 : currentYear;
                              const monthStr = String(monthIndex + 1).padStart(2, '0');
                              const autoStartDate = `${targetYear}-${monthStr}-01`;

                              const startObj = new Date(targetYear, monthIndex, 1);
                              startObj.setDate(startObj.getDate() + 7);
                              const endYear = startObj.getFullYear();
                              const endMonthStr = String(startObj.getMonth() + 1).padStart(2, '0');
                              const endDayStr = String(startObj.getDate()).padStart(2, '0');
                              const autoEndDate = `${endYear}-${endMonthStr}-${endDayStr}`;

                              onChange({
                                ...filters,
                                travelMonth: m,
                                startDate: autoStartDate,
                                endDate: autoEndDate,
                                datesNotDecided: false,
                              });
                            }
                          }}
                          className={`gs-filter-pill${filters.travelMonth === m ? ' active' : ''}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Wildlife Seasons & Natural Events */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Wildlife Seasons & Migration Events
                  </label>
                  <div className="gs-tiles-grid cols-3">
                    {SEASONS.map((s) => {
                      const isSelected = filters.seasons.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleArrayItem('seasons', s.id)}
                          className={`gs-tile-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <div className="gs-tile-indicator">{isSelected ? '✓' : ''}</div>
                          <div className="gs-tile-info">
                            <span className="gs-tile-title">{s.id}</span>
                            <span className="gs-tile-sub">{s.label.split('(')[1]?.replace(')', '') || s.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Chapter 02: Party Composition & Accommodation Standard ──── */}
            <div className="gs-filter-chapter-card">
              <div className="gs-filter-chapter-header">
                <span className="gs-filter-chapter-num">02</span>
                <div>
                  <h3 className="gs-filter-chapter-title">Party Composition & Accommodation Standard</h3>
                  <p className="gs-filter-chapter-desc">Tailored rooming, park fees, and vehicle setups for couples, families, or private groups.</p>
                </div>
              </div>

              <div className="gs-filter-chapter-body">
                {/* Traveller Type */}
                <div className="gs-filter-inner-block">
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Who Is Traveling?
                  </label>
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
                </div>

                {/* Adults & Children Steppers */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <div className="gs-party-stepper-row">
                    <div className="gs-party-stepper-card">
                      <div>
                        <span className="gs-party-title">Adults (12+ yrs)</span>
                        <span className="gs-party-sub">Standard park fee & room basis</span>
                      </div>
                      <div className="gs-stepper">
                        <button
                          type="button"
                          onClick={() => onChange({ ...filters, adults: Math.max(1, filters.adults - 1) })}
                        >
                          -
                        </button>
                        <span className="gs-stepper-val">{filters.adults}</span>
                        <button
                          type="button"
                          onClick={() => onChange({ ...filters, adults: filters.adults + 1 })}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="gs-party-stepper-card">
                      <div>
                        <span className="gs-party-title">Children (&lt;12 yrs)</span>
                        <span className="gs-party-sub">Discounted permits & family tents</span>
                      </div>
                      <div className="gs-stepper">
                        <button
                          type="button"
                          onClick={() => onChange({ ...filters, children: Math.max(0, filters.children - 1) })}
                        >
                          -
                        </button>
                        <span className="gs-stepper-val">{filters.children}</span>
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
                    <div className="gs-child-ages-box">
                      <span className="gs-child-ages-title">
                        Age of each child at travel (for park permits & bed arrangements):
                      </span>
                      <div className="gs-child-ages-grid">
                        {Array.from({ length: filters.children }).map((_, idx) => (
                          <div key={idx} className="gs-child-age-item">
                            <span className="gs-child-age-label">Child {idx + 1} Age</span>
                            <input
                              type="number"
                              min={1}
                              max={17}
                              className="gs-input"
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

                {/* Accommodation Standards */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Accommodation Tier Standard
                  </label>
                  <div className="gs-tiles-grid cols-3">
                    {COMFORT_LEVELS.map((c) => {
                      const isSelected = filters.comfortLevels.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleArrayItem('comfortLevels', c.id)}
                          className={`gs-tile-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <div className="gs-tile-indicator">{isSelected ? '✓' : ''}</div>
                          <div className="gs-tile-info">
                            <span className="gs-tile-title">{c.id} Tier</span>
                            <span className="gs-tile-sub">{c.label.split('(')[1]?.replace(')', '') || c.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Chapter 03: Circuits & Signature Passions ───────────────── */}
            <div className="gs-filter-chapter-card">
              <div className="gs-filter-chapter-header">
                <span className="gs-filter-chapter-num">03</span>
                <div>
                  <h3 className="gs-filter-chapter-title">Circuits & Signature Passions</h3>
                  <p className="gs-filter-chapter-desc">Choose which wilderness regions and signature safari activities you want included.</p>
                </div>
              </div>

              <div className="gs-filter-chapter-body">
                {/* Safari Regions */}
                <div className="gs-filter-inner-block">
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Preferred Safari Regions
                  </label>
                  <div className="gs-tiles-grid cols-3">
                    {REGIONS.map((r) => {
                      const isSelected = filters.regions.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleArrayItem('regions', r.id)}
                          className={`gs-tile-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <div className="gs-tile-indicator">{isSelected ? '✓' : ''}</div>
                          <div className="gs-tile-info">
                            <span className="gs-tile-title">{r.id}</span>
                            <span className="gs-tile-sub">{r.label.split('(')[1]?.replace(')', '') || r.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Passions */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Signature Experiences & Passions
                  </label>
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
              </div>
            </div>

            {/* ── Chapter 04: Style, Pace, Duration & Budget ──────────────── */}
            <div className="gs-filter-chapter-card">
              <div className="gs-filter-chapter-header">
                <span className="gs-filter-chapter-num">04</span>
                <div>
                  <h3 className="gs-filter-chapter-title">Journey Style, Pace & Investment</h3>
                  <p className="gs-filter-chapter-desc">Select how you prefer to travel, your ideal safari duration, and investment parameters.</p>
                </div>
              </div>

              <div className="gs-filter-chapter-body">
                {/* Duration Tiles */}
                <div className="gs-filter-inner-block">
                  <label className="gs-filter-sublabel" style={{ marginBottom: '10px', display: 'block' }}>
                    Preferred Safari Duration
                  </label>
                  <div className="gs-tiles-grid cols-5">
                    {DURATION_RANGES.map((d) => {
                      const isSelected = filters.durationRanges.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleArrayItem('durationRanges', d.id)}
                          className={`gs-tile-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <div className="gs-tile-indicator">{isSelected ? '✓' : ''}</div>
                          <div className="gs-tile-info">
                            <span className="gs-tile-title">{d.id}</span>
                            <span className="gs-tile-sub">{d.label.includes('(') ? d.label.split('(')[1]?.replace(')', '') : 'Days'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transport & Pace */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                      <label className="gs-filter-sublabel" style={{ marginBottom: '8px', display: 'block' }}>
                        Transport Style
                      </label>
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
                      <label className="gs-filter-sublabel" style={{ marginBottom: '8px', display: 'block' }}>
                        Trip Pace
                      </label>
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
                </div>

                {/* Budget & Accessibility Notes */}
                <div className="gs-filter-inner-block" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div className="gs-budget-slider-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="gs-filter-sublabel">Max Budget per Person</label>
                        <strong className="gs-budget-val">
                          {filters.budgetPerPerson ? `$${filters.budgetPerPerson.toLocaleString()}` : 'Flexible'}
                        </strong>
                      </div>
                      <input
                        type="range"
                        min={2000}
                        max={12000}
                        step={500}
                        value={filters.budgetPerPerson || 8000}
                        onChange={(e) => onChange({ ...filters, budgetPerPerson: parseInt(e.target.value, 10) })}
                        className="gs-budget-range-input"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginTop: '4px' }}>
                        <span>$2,000</span>
                        <span>$6,000</span>
                        <span>$12,000+</span>
                      </div>
                    </div>

                    <div>
                      <label className="gs-filter-sublabel" style={{ marginBottom: '8px', display: 'block' }}>
                        Accessibility & Special Dietary Needs
                      </label>
                      <input
                        type="text"
                        className="gs-input"
                        placeholder="Dietary requirements, limited mobility, cpap machine…"
                        value={filters.accessibilityNotes || ''}
                        onChange={(e) => onChange({ ...filters, accessibilityNotes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Vertical Match Action Dock (Right Side) ──────────────────── */}
          <div className="gs-filter-vertical-dock">
            <div className="gs-filter-dock-header">
              <span className="gs-filter-dock-badge">Live Match</span>
              <button
                type="button"
                onClick={() => onChange({
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
                })}
                className="gs-filter-reset-btn"
              >
                Reset Filters
              </button>
            </div>

            <div className="gs-filter-dock-body">
              <span className="gs-filter-dock-count-large">{rankedResults.length}</span>
              <h4 className="gs-filter-dock-title">Matched Safari Journeys</h4>
              <p className="gs-filter-dock-sub">
                Calculated based on your timing, party size, and wildlife preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className="gs-btn-orange gs-btn-full"
              style={{ padding: '12px 16px', fontSize: '0.88rem' }}
            >
              View {rankedResults.length} Matched Journeys ➔
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 2: Ranked Recommendations Search Results ───────────────── */}
      {activeTab === 'results' && (
        <div className="gs-ranked-results-grid">
          {rankedResults.map(({ pkg, score, reasons }) => {
            const isCompared = comparedPackageIds.includes(pkg.id);
            const exampleLodges = pkg.accommodation.options[0]?.properties.slice(0, 2).map((p) => p.name).join(', ') || 'Vetted safari lodges';

            return (
              <div key={pkg.id} className="gs-luxury-safari-card">
                {/* Left Side: Details, Metadata, and CTAs (Image 2 format) */}
                <div className="gs-card-content-col">
                  <div>
                    <span className="gs-compare-pkg-num" style={{ display: 'block', marginBottom: '2px' }}>
                      Journey 0{pkg.id} · {pkg.strategicJob}
                    </span>
                    <h3 className="gs-card-title">{pkg.title}</h3>
                    <div className="gs-card-price-row">
                      <span>from</span>
                      <strong>${pkg.basePriceComfort.toLocaleString()}</strong>
                      <span style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>pp sharing (Comfort)</span>
                    </div>
                  </div>

                  {/* Clean Metadata Rows */}
                  <div className="gs-card-meta-list">
                    {/* Region & Route */}
                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span>{pkg.route.slice(0, 4).join(' · ')}{pkg.route.length > 4 ? ` · ${pkg.route[pkg.route.length - 1]}` : ''}</span>
                    </div>

                    {/* Duration & Months */}
                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="18" y2="10" />
                      </svg>
                      <span>{pkg.durationDays} Days / {pkg.durationNights} Nights · Best: {pkg.bestMonths.slice(0, 2).join(', ')}</span>
                    </div>

                    {/* Transport & Party Basis */}
                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Min 2 guests (Max 6) · {pkg.travelStyle.split(',')[0]}</span>
                    </div>

                    {/* Example Accommodation */}
                    <div className="gs-card-meta-item">
                      <svg className="gs-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>Stays: {exampleLodges}</span>
                    </div>
                  </div>

                  {/* Why this matches you explanation */}
                  {score > 60 && reasons.length > 0 && (
                    <div className="gs-card-match-pill">
                      <span>✓ Why this matches: {reasons[0]}</span>
                    </div>
                  )}

                  {/* Action Buttons: View Itinerary & Customize */}
                  <div className="gs-card-footer-actions">
                    <button
                      type="button"
                      onClick={() => onSelectPackage(pkg)}
                      className="gs-btn-explore-pill"
                    >
                      <span>Customize Journey</span>
                      <span>➔</span>
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

                {/* Right Side: Square 1:1 Visual */}
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
