'use client';
// src/app/my-trips/page.tsx
// Customer "My Journeys" Portal — View, Re-open, and Manage Safari Drafts & Quotes

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSavedDrafts, SavedItineraryDraft, removeItineraryDraft } from '@/lib/draftStorage';

interface BookingRecord {
  id: string;
  booking_reference: string;
  package_id: number;
  travel_type: string;
  arrival_date?: string;
  travel_duration: string;
  adults: number;
  children: number;
  single_room_requested: boolean;
  booking_status: string;
  payment_status: string;
  created_at: string;
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
      setErrorMsg('Please enter your email address or booking reference.');
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
        setErrorMsg(json.error || 'Lookup failed.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenInCustomizer = (packageId: number, tier?: string, adultsCount?: number, childrenCount?: number, date?: string) => {
    const params = new URLSearchParams({
      package: packageId.toString(),
      tier: tier || 'Comfort',
      adults: (adultsCount || 2).toString(),
      children: (childrenCount || 0).toString(),
    });
    if (date) params.set('date', date);
    router.push(`/?${params.toString()}`);
  };

  const handleDeleteLocalDraft = (id: string) => {
    removeItineraryDraft(id);
    setBrowserDrafts(getSavedDrafts());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="gs-badge-gold" style={{ background: 'rgba(46, 125, 82, 0.2)', color: '#2E7D52', borderColor: '#2E7D52' }}>✓ Final Quotation Issued</span>;
      case 'cancelled':
        return <span className="gs-badge-glass" style={{ color: 'var(--gs-error)', borderColor: 'var(--gs-error)' }}>✕ Cancelled</span>;
      case 'pending':
      default:
        return <span className="gs-badge-gold">⏳ Under Grafton Review</span>;
    }
  };

  return (
    <div className="gs-app-shell">
      {/* Header */}
      <header className="gs-editorial-header">
        <div className="gs-header-brand-wrap" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div className="gs-brand-monogram">G</div>
          <div className="gs-brand-titles">
            <h1>Grafton Safaris</h1>
            <span>My Journeys & Proposals</span>
          </div>
        </div>

        <div className="gs-header-nav-actions">
          <button onClick={() => router.push('/')} className="gs-btn gs-btn-ghost-light gs-btn-sm">
            ← Safari Catalog
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="gs-badge-gold">Traveler Portal</span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', margin: '12px 0 8px' }}>
            Your Saved Journeys & Quotations
          </h2>
          <p style={{ color: 'var(--gs-text-muted)', fontSize: '0.95rem' }}>
            Look up your bespoke safari proposals using your reference code or email address.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="gs-builder-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--gs-forest)' }}>
            🔍 Look Up Your Grafton Proposal
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="gs-label">Booking Reference</label>
              <input
                type="text"
                className="gs-input"
                placeholder="e.g. GSF-2027-4912"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>

            <div>
              <label className="gs-label">Or Email Address</label>
              <input
                type="email"
                className="gs-input"
                placeholder="you@email.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="gs-alert gs-alert-error" style={{ marginBottom: '14px' }}>
              <span>⚠</span> <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={() => handleLookup()}
            className="gs-btn gs-btn-gold gs-btn-md gs-glow-btn"
            disabled={loading}
          >
            {loading ? <span className="gs-spinner" /> : 'Find My Proposals ➔'}
          </button>
        </div>

        {/* Server Found Bookings */}
        {searched && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--gs-forest)' }}>
              Submitted Proposals ({serverBookings.length})
            </h3>

            {serverBookings.length === 0 ? (
              <div className="gs-builder-card" style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: 'var(--gs-text-muted)' }}>No submitted proposals found matching this search.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {serverBookings.map((b) => (
                  <div key={b.id} className="gs-builder-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--gs-gold-dark)' }}>
                            {b.booking_reference}
                          </span>
                          {getStatusBadge(b.booking_status)}
                        </div>
                        <h4 style={{ fontSize: '1.3rem', margin: '4px 0', color: 'var(--gs-forest)' }}>
                          {b.travel_type}
                        </h4>
                        <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)' }}>
                          Submitted on {new Date(b.created_at).toLocaleDateString()} · {b.travel_duration}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--gs-text-muted)' }}>Quoted Rate</span>
                        <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gs-forest)' }}>
                          {b.preferences?.finalQuotedPrice
                            ? `$${b.preferences.finalQuotedPrice.toLocaleString()}`
                            : b.preferences?.indicativeTotalPrice
                            ? `$${b.preferences.indicativeTotalPrice.toLocaleString()} (Indicative)`
                            : 'Price under review'}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--gs-sand)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                        <div><strong>Party:</strong> {b.adults} Adults{b.children > 0 ? `, ${b.children} Children` : ''}</div>
                        <div><strong>Dates:</strong> {b.arrival_date || b.preferences?.travelMonth || 'Flexible'}</div>
                        <div><strong>Tier:</strong> {b.preferences?.accommodationTier || 'Comfort'} Accommodation</div>
                        <div><strong>Payment:</strong> <span style={{ textTransform: 'capitalize' }}>{b.payment_status.replace('_', ' ')}</span></div>
                      </div>

                      {b.preferences?.consultantNotes && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--gs-sand-dark)', color: 'var(--gs-forest)' }}>
                          <strong>Consultant Notes:</strong> {b.preferences.consultantNotes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleReopenInCustomizer(b.package_id, b.preferences?.accommodationTier, b.adults, b.children, b.arrival_date)}
                        className="gs-btn gs-btn-gold gs-btn-sm"
                      >
                        Re-open in Customizer ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local 30-Day Browser Drafts */}
        <div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--gs-forest)' }}>
            💾 Saved Browser Drafts (30-Day Storage: {browserDrafts.length})
          </h3>

          {browserDrafts.length === 0 ? (
            <div className="gs-builder-card" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: 'var(--gs-text-muted)' }}>No saved browser drafts. When you click "Save Draft" in the customizer, your itineraries appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {browserDrafts.map((d) => (
                <div key={d.id} className="gs-builder-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="gs-badge-gold-sm">{d.accommodationTier}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)' }}>
                      Expires: {new Date(d.expiresAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 style={{ margin: '4px 0', fontSize: '1.1rem', color: 'var(--gs-forest)' }}>
                    {d.packageTitle}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)', marginBottom: '14px' }}>
                    {d.adults} Adults{d.children > 0 ? `, ${d.children} Children` : ''} · {d.travelMonth || 'Flexible'}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--gs-forest)' }}>
                      {d.indicativePricePerPerson ? `$${d.indicativePricePerPerson.toLocaleString()} pp` : 'Under review'}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleReopenInCustomizer(d.packageId, d.accommodationTier, d.adults, d.children, d.travelDate)}
                        className="gs-btn gs-btn-gold gs-btn-sm"
                      >
                        Open ➔
                      </button>
                      <button
                        onClick={() => handleDeleteLocalDraft(d.id)}
                        className="gs-btn gs-btn-ghost gs-btn-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
