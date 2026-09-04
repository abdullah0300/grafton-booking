'use client';
// src/app/my-trips/page.tsx
// Customer "My Journeys" Portal — High-End Proposal & Itinerary Hub

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSavedDrafts, SavedItineraryDraft, removeItineraryDraft } from '@/lib/draftStorage';
import { SAFARI_PACKAGES, GLOBAL_ADDONS } from '@/data/packages';

interface BookingRecord {
  id: string;
  booking_reference: string;
  package_id: number;
  travel_type: string;
  full_name?: string;
  email?: string;
  phone?: string;
  arrival_date?: string;
  travel_duration: string;
  adults: number;
  children: number;
  single_room_requested: boolean;
  booking_status: string;
  payment_status: string;
  created_at: string;
  custom_message?: string;
  preferences?: {
    accommodationTier?: string;
    travelMonth?: string;
    selectedAddonIds?: string[];
    indicativePricePerPerson?: number;
    indicativeTotalPrice?: number;
    finalQuotedPrice?: number;
    consultantNotes?: string;
    season?: string;
  };
  packages?: {
    id: number;
    title: string;
    slug: string;
    duration: string;
    indicative_price: number;
  };
}

function MyTripsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const initialEmail = searchParams.get('email') || '';

  const [searchRef, setSearchRef] = useState<string>(initialRef);
  const [searchEmail, setSearchEmail] = useState<string>(initialEmail);
  const [loading, setLoading] = useState<boolean>(false);
  const [serverBookings, setServerBookings] = useState<BookingRecord[]>([]);
  const [browserDrafts, setBrowserDrafts] = useState<SavedItineraryDraft[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    setBrowserDrafts(getSavedDrafts());
    if (initialRef || initialEmail) {
      handleLookup(initialRef, initialEmail);
    }
  }, [initialRef, initialEmail]);

  const handleLookup = async (refVal?: string, emailVal?: string) => {
    const r = (refVal ?? searchRef).trim();
    const e = (emailVal ?? searchEmail).trim();

    if (!r && !e) {
      setErrorMsg('Please enter your email address or booking reference code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (r) params.set('ref', r);
      else if (e) params.set('email', e);

      const res = await fetch(`/api/customer/lookup?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setServerBookings(json.data || []);
      } else {
        setErrorMsg(json.error || 'No matching proposals found.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenInCustomizer = (
    packageId: number,
    tier?: string,
    adultsCount?: number,
    childrenCount?: number,
    date?: string,
    month?: string,
    addonIds?: string[],
    singleRoom?: boolean
  ) => {
    const params = new URLSearchParams({
      package: packageId.toString(),
      tier: tier || 'Comfort',
      adults: (adultsCount || 2).toString(),
      children: (childrenCount || 0).toString(),
      openPlan: 'true',
    });
    if (date) params.set('date', date);
    if (month) params.set('month', month);
    if (addonIds && addonIds.length > 0) {
      params.set('addons', addonIds.join(','));
    }
    if (singleRoom) {
      params.set('singleRoom', '1');
    }
    router.push(`/?${params.toString()}`);
  };

  const handleDeleteLocalDraft = (id: string) => {
    removeItineraryDraft(id);
    setBrowserDrafts(getSavedDrafts());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="gs-portal-status-badge is-confirmed">
            ✓ Final Quotation Issued
          </span>
        );
      case 'cancelled':
        return (
          <span className="gs-portal-status-badge is-cancelled">
            ✕ Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="gs-portal-status-badge is-pending">
            ⏳ Under Grafton Review
          </span>
        );
    }
  };

  return (
    <div className="gs-portal-page-shell">
      {/* Top Navigation Bar */}
      <header className="gs-portal-header">
        <div className="gs-portal-header-inner">
          <div className="gs-portal-brand" onClick={() => router.push('/')}>
            <div className="gs-portal-logo-mark">G</div>
            <div className="gs-portal-brand-text">
              <span className="gs-portal-brand-title">GRAFTON SAFARIS</span>
              <span className="gs-portal-brand-subtitle">Traveler Portfolio &amp; Proposals</span>
            </div>
          </div>

          <button onClick={() => router.push('/')} className="gs-btn-portal-back">
            ← Explore Safaris
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="gs-portal-main">
        {/* Hero Section */}
        <section className="gs-portal-hero-section">
          <span className="gs-badge-olive">Private Traveler Hub</span>
          <h1 className="gs-portal-hero-title">Your Saved Journeys &amp; Proposals</h1>
          <p className="gs-portal-hero-desc">
            Look up your tailored safari proposals, track live consultation status, or resume customizing saved itinerary drafts.
          </p>
        </section>

        {/* Search & Lookup Card */}
        <section className="gs-portal-card gs-portal-search-card">
          <div className="gs-portal-card-header">
            <h3 className="gs-portal-card-title">Look Up Your Grafton Proposal</h3>
            <p className="gs-portal-card-desc">Enter your unique reference code (e.g. GSF-2027-4912) or the email used during quote submission.</p>
          </div>

          <div className="gs-portal-search-grid">
            <div className="gs-field">
              <label className="gs-label">Booking Reference Code</label>
              <input
                type="text"
                className="gs-input"
                placeholder="e.g. GSF-2027-4912"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>

            <div className="gs-field">
              <label className="gs-label">Or Registered Email</label>
              <input
                type="email"
                className="gs-input"
                placeholder="traveler@domain.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="gs-alert gs-alert-error" style={{ marginTop: '14px' }}>
              <span>⚠</span> <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleLookup()}
              className="gs-btn-orange"
              style={{ padding: '12px 28px', fontSize: '0.9rem' }}
              disabled={loading}
            >
              {loading ? 'Searching Proposals…' : 'Find My Proposals ➔'}
            </button>
          </div>
        </section>

        {/* Submitted Proposals Results */}
        {searched && (
          <section className="gs-portal-results-section">
            <div className="gs-portal-section-header">
              <h3 className="gs-portal-section-title">
                Submitted Proposals <span className="gs-portal-count-badge">{serverBookings.length}</span>
              </h3>
            </div>

            {serverBookings.length === 0 ? (
              <div className="gs-portal-empty-card">
                <div className="gs-portal-empty-icon">📂</div>
                <h4 className="gs-portal-empty-title">No Proposals Found</h4>
                <p className="gs-portal-empty-desc">
                  We could not locate any active proposals matching this reference or email. Please double-check your spelling or contact your Grafton travel specialist.
                </p>
              </div>
            ) : (
              <div className="gs-portal-proposals-grid">
                {serverBookings.map((b) => (
                  <div key={b.id} className="gs-portal-proposal-card">
                    <div className="gs-portal-proposal-header">
                      <div>
                        <div className="gs-portal-ref-row">
                          <span className="gs-portal-ref-code">{b.booking_reference}</span>
                          {getStatusBadge(b.booking_status)}
                        </div>
                        <h4 className="gs-portal-proposal-name">{b.travel_type}</h4>
                        <span className="gs-portal-date-sub">
                          Submitted on {new Date(b.created_at).toLocaleDateString()} · {b.travel_duration}
                        </span>
                      </div>

                      <div className="gs-portal-price-col">
                        <span className="gs-portal-price-label">Quoted Investment</span>
                        <span className="gs-portal-price-val">
                          {b.preferences?.finalQuotedPrice
                            ? `$${b.preferences.finalQuotedPrice.toLocaleString()}`
                            : b.preferences?.indicativeTotalPrice
                            ? `$${b.preferences.indicativeTotalPrice.toLocaleString()}`
                            : 'Under Review'}
                        </span>
                        {b.preferences?.finalQuotedPrice ? (
                          <span className="gs-portal-price-sub">Guaranteed Rate</span>
                        ) : (
                          <span className="gs-portal-price-sub">Indicative Estimate</span>
                        )}
                      </div>
                    </div>

                    {/* Proposal Details Pill Grid */}
                    <div className="gs-portal-params-grid">
                      <div className="gs-portal-param-box">
                        <span className="gs-portal-param-label">Party</span>
                        <span className="gs-portal-param-val">
                          {b.adults} Adults{b.children > 0 ? `, ${b.children} Children` : ''}
                        </span>
                      </div>
                      <div className="gs-portal-param-box">
                        <span className="gs-portal-param-label">Timing</span>
                        <span className="gs-portal-param-val">
                          {b.arrival_date || b.preferences?.travelMonth || 'Flexible Season'}
                        </span>
                      </div>
                      <div className="gs-portal-param-box">
                        <span className="gs-portal-param-label">Accommodation</span>
                        <span className="gs-portal-param-val">
                          {b.preferences?.accommodationTier || 'Comfort'} Standard
                        </span>
                      </div>
                      <div className="gs-portal-param-box">
                        <span className="gs-portal-param-label">Payment</span>
                        <span className="gs-portal-param-val" style={{ textTransform: 'capitalize' }}>
                          {b.payment_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Consultant Feedback Notes */}
                    {b.preferences?.consultantNotes && (
                      <div className="gs-portal-consultant-notes">
                        <span className="gs-portal-notes-title">💬 Message from Grafton Specialist:</span>
                        <p className="gs-portal-notes-text">{b.preferences.consultantNotes}</p>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="gs-portal-proposal-footer" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setViewingBooking(b)}
                        className="gs-btn-portal-back"
                        style={{ padding: '9px 18px', fontSize: '0.84rem' }}
                      >
                        View Proposal Dossier 🔍
                      </button>
                      <button
                        onClick={() => handleReopenInCustomizer(
                          b.package_id,
                          b.preferences?.accommodationTier,
                          b.adults,
                          b.children,
                          b.arrival_date,
                          b.preferences?.travelMonth,
                          b.preferences?.selectedAddonIds,
                          b.single_room_requested
                        )}
                        className="gs-btn-orange"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                      >
                        Re-open &amp; Customize Itinerary ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* If User Has Active Local Browser Drafts, show them */}
        {browserDrafts.length > 0 && (
          <section className="gs-portal-drafts-section">
            <div className="gs-portal-section-header">
              <div>
                <h3 className="gs-portal-section-title">
                  Saved Browser Drafts <span className="gs-portal-count-badge">{browserDrafts.length}</span>
                </h3>
                <p className="gs-portal-section-desc">Unfinished custom itineraries stored in your local browser for up to 30 days.</p>
              </div>
            </div>

            <div className="gs-portal-drafts-grid">
              {browserDrafts.map((d) => (
                <div key={d.id} className="gs-portal-draft-card">
                  <div className="gs-portal-draft-header">
                    <span className="gs-badge-olive">{d.accommodationTier} Tier</span>
                    <span className="gs-portal-draft-expiry">
                      Expires: {new Date(d.expiresAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="gs-portal-draft-title">{d.packageTitle}</h4>
                  <p className="gs-portal-draft-party">
                    {d.adults} Adults{d.children > 0 ? `, ${d.children} Children` : ''} · {d.travelMonth || 'Flexible'}
                  </p>

                  <div className="gs-portal-draft-footer">
                    <div className="gs-portal-draft-price">
                      <span className="gs-portal-draft-price-val">
                        {d.indicativePricePerPerson ? `$${d.indicativePricePerPerson.toLocaleString()}` : 'Under review'}
                      </span>
                      <span className="gs-portal-draft-price-unit">/ person</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleReopenInCustomizer(
                          d.packageId,
                          d.accommodationTier,
                          d.adults,
                          d.children,
                          d.travelDate,
                          d.travelMonth,
                          d.selectedAddonIds,
                          (d.rooms?.singleRooms || 0) > 0
                        )}
                        className="gs-btn-orange"
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                      >
                        Resume ➔
                      </button>
                      <button
                        onClick={() => handleDeleteLocalDraft(d.id)}
                        className="gs-btn-portal-delete"
                        title="Delete draft"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Prestigious Value Pillars & Support for Logged-Out / Unsearched Travelers */}
        {!searched && browserDrafts.length === 0 && (
          <section className="gs-portal-pillars-section">
            <div className="gs-portal-pillars-grid">
              <div className="gs-portal-pillar-card">
                <div className="gs-portal-pillar-icon">🗺️</div>
                <h4 className="gs-portal-pillar-title">Real-Time Proposal Tracking</h4>
                <p className="gs-portal-pillar-desc">
                  Access your bespoke safari quotes, vetted lodge allocations, and customized route timelines directly online.
                </p>
              </div>

              <div className="gs-portal-pillar-card">
                <div className="gs-portal-pillar-icon">💬</div>
                <h4 className="gs-portal-pillar-title">Direct Specialist Notes</h4>
                <p className="gs-portal-pillar-desc">
                  Read personalized guidance, flight recommendations, and timing insights from senior safari consultants in Arusha.
                </p>
              </div>

              <div className="gs-portal-pillar-card">
                <div className="gs-portal-pillar-icon">✏️</div>
                <h4 className="gs-portal-pillar-title">1-Click Itinerary Revisions</h4>
                <p className="gs-portal-pillar-desc">
                  Seamlessly re-open your itinerary in the interactive planner to tweak guest counts, travel dates, or comfort tiers.
                </p>
              </div>
            </div>

            {/* Assistance Strip */}
            <div className="gs-portal-help-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🛎️</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--gs-forest)', fontSize: '0.9rem' }}>
                    Need help locating your reference code?
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                    Reference codes follow the format <code>GSF-YYYY-XXXX</code> and are included in your confirmation email.
                  </span>
                </div>
              </div>
              <a
                href="mailto:gstt@graftonsafaris.com"
                className="gs-btn-portal-back"
                style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Contact Concierge ➔
              </a>
            </div>
          </section>
        )}

        {/* ── Customer Proposal Dossier Modal ────────────────────────────── */}
        {viewingBooking && (() => {
          const selectedAddonObjects = (viewingBooking.preferences?.selectedAddonIds || [])
            .map((id) => GLOBAL_ADDONS.find((a) => a.id === id))
            .filter(Boolean);

          const indicativeTotal = viewingBooking.preferences?.indicativeTotalPrice;
          const indicativePerPerson = viewingBooking.preferences?.indicativePricePerPerson;
          const finalPrice = viewingBooking.preferences?.finalQuotedPrice;
          const totalGuests = (viewingBooking.adults || 0) + (viewingBooking.children || 0) || 1;

          return (
            <div className="gs-modal-backdrop" onClick={() => setViewingBooking(null)}>
              <div
                className="gs-admin-review-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="gs-admin-review-modal-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="gs-badge-olive">Safari Proposal Dossier</span>
                      <span className="gs-admin-ref-code">{viewingBooking.booking_reference}</span>
                      {getStatusBadge(viewingBooking.booking_status)}
                    </div>
                    <h2 className="gs-admin-review-modal-title">
                      {viewingBooking.travel_type}
                    </h2>
                    <p className="gs-admin-review-modal-sub">
                      Submitted on {new Date(viewingBooking.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {viewingBooking.travel_duration}
                    </p>
                  </div>
                  <button onClick={() => setViewingBooking(null)} className="gs-modal-close-btn" aria-label="Close modal">✕</button>
                </div>

                <div className="gs-admin-review-modal-body">
                  {/* Section 1: Specifications Grid */}
                  <div className="gs-admin-dossier-grid">
                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Departure Timing</span>
                      <span className="gs-admin-dossier-val">
                        {viewingBooking.arrival_date
                          ? new Date(viewingBooking.arrival_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                          : viewingBooking.preferences?.travelMonth || 'Dates flexible'}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Preferred Season / Month</span>
                      <span className="gs-admin-dossier-val">
                        {viewingBooking.preferences?.travelMonth || 'Flexible Season'}
                        {viewingBooking.preferences?.season ? ` (${viewingBooking.preferences.season})` : ''}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Party Composition</span>
                      <span className="gs-admin-dossier-val">
                        {viewingBooking.adults} Adults{viewingBooking.children > 0 ? `, ${viewingBooking.children} Children` : ''}
                        {viewingBooking.single_room_requested ? ' · Single Room' : ''}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Accommodation Standard</span>
                      <span className="gs-admin-dossier-val" style={{ color: 'var(--gs-olive)' }}>
                        ★ {viewingBooking.preferences?.accommodationTier || 'Comfort'} Tier
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Selected Add-On Experiences */}
                  <div className="gs-admin-dossier-addons-block">
                    <span className="gs-admin-dossier-section-title">
                      Selected Add-On Experiences ({selectedAddonObjects.length})
                    </span>
                    {selectedAddonObjects.length === 0 ? (
                      <p className="gs-admin-addons-empty">No optional add-ons requested for this itinerary.</p>
                    ) : (
                      <div className="gs-admin-addons-chips-grid">
                        {selectedAddonObjects.map((addon) => addon && (
                          <div key={addon.id} className="gs-admin-addon-chip">
                            <div>
                              <strong className="gs-admin-addon-name">{addon.name}</strong>
                              <span className="gs-admin-addon-desc">{addon.description || addon.locations?.join(' · ')}</span>
                            </div>
                            <span className="gs-admin-addon-price">+${addon.pricePerPerson} pp</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Client Special Requests */}
                  {viewingBooking.custom_message && (
                    <div className="gs-admin-client-note-card">
                      <span className="gs-admin-client-note-label">💬 Your Special Requests &amp; Notes:</span>
                      <p className="gs-admin-client-note-quote">"{viewingBooking.custom_message}"</p>
                    </div>
                  )}

                  {/* Section 4: Consultant Message & Confirmation */}
                  {viewingBooking.preferences?.consultantNotes && (
                    <div className="gs-portal-consultant-notes" style={{ padding: '16px 20px', borderRadius: '14px' }}>
                      <span className="gs-portal-notes-title" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                        💬 Message from Grafton Safari Specialist:
                      </span>
                      <p className="gs-portal-notes-text" style={{ fontSize: '0.88rem' }}>
                        {viewingBooking.preferences.consultantNotes}
                      </p>
                    </div>
                  )}

                  {/* Section 5: Financial Overview */}
                  <div className="gs-admin-quotation-edit-section" style={{ background: '#FAF8F4' }}>
                    <div className="gs-admin-pricing-benchmarks" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                      <div>
                        <span className="gs-admin-bench-label">
                          {finalPrice ? 'Guaranteed Quoted Investment' : 'Indicative Pricing Estimate'}
                        </span>
                        <span className="gs-admin-bench-val" style={{ color: finalPrice ? '#2E7D52' : 'var(--gs-forest)' }}>
                          {finalPrice
                            ? `$${finalPrice.toLocaleString()}`
                            : indicativeTotal
                            ? `$${indicativeTotal.toLocaleString()}`
                            : 'Under Review'}
                        </span>
                        <span className="gs-admin-bench-sub">
                          ({finalPrice
                            ? `$${Math.round(finalPrice / totalGuests).toLocaleString()}`
                            : indicativePerPerson
                            ? `$${indicativePerPerson.toLocaleString()}`
                            : 'Calculated'} per person)
                        </span>
                      </div>
                      <div>
                        <span className="gs-badge-olive">
                          Payment Status: {viewingBooking.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="gs-admin-modal-footer">
                    <button
                      type="button"
                      onClick={() => setViewingBooking(null)}
                      className="gs-btn-portal-back"
                    >
                      Close
                    </button>
                    <a
                      href={`mailto:gstt@graftonsafaris.com?subject=Inquiry on Proposal ${viewingBooking.booking_reference}`}
                      className="gs-btn-portal-back"
                      style={{ textDecoration: 'none' }}
                    >
                      ✉ Contact Specialist
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const targetBooking = viewingBooking;
                        setViewingBooking(null);
                        handleReopenInCustomizer(
                          targetBooking.package_id,
                          targetBooking.preferences?.accommodationTier,
                          targetBooking.adults,
                          targetBooking.children,
                          targetBooking.arrival_date,
                          targetBooking.preferences?.travelMonth,
                          targetBooking.preferences?.selectedAddonIds,
                          targetBooking.single_room_requested
                        );
                      }}
                      className="gs-btn-orange"
                      style={{ padding: '12px 24px', fontSize: '0.88rem' }}
                    >
                      Re-open &amp; Customize in Planner ➔
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}

export default function MyTripsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0D1B15', color: '#D4AF6B' }}>Loading…</div>}>
      <MyTripsContent />
    </Suspense>
  );
}

