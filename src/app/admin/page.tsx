'use client';
// src/app/admin/page.tsx
// Grafton Safaris — Admin Operations Cockpit & Secret Passkey Login

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BookingRecord {
  id: string;
  booking_reference: string;
  package_id: number;
  travel_type: string;
  full_name: string;
  email: string;
  phone: string;
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
}

interface DepartureRecord {
  id: string;
  departure_date: string;
  return_date: string;
  max_capacity: number;
  booked_seats: number;
  price_per_person: number;
  single_supplement_price: number;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkey, setPasskey] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'bookings' | 'departures'>('bookings');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [departures, setDepartures] = useState<DepartureRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Selected Booking for Quotation Editor Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('unpaid');
  const [editFinalPrice, setEditFinalPrice] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingQuote, setSavingQuote] = useState<boolean>(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Check auth and load bookings on mount
  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setAuthenticating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: passkey.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAuthenticated(true);
        loadBookings();
        loadDepartures();
      } else {
        setAuthError(json.error || 'Authentication failed.');
      }
    } catch {
      setAuthError('Network error during login.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setPasskey('');
  };

  const loadBookings = async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (json.success) {
        setIsAuthenticated(true);
        setBookings(json.data || []);
        if (json.stats) setStats(json.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  const loadDepartures = async () => {
    try {
      const res = await fetch('/api/admin/departures');
      const json = await res.json();
      if (json.success) {
        setDepartures(json.data || []);
      }
    } catch {
      // ignore
    }
  };

  const openBookingEditor = (b: BookingRecord) => {
    setSelectedBooking(b);
    setEditStatus(b.booking_status);
    setEditPaymentStatus(b.payment_status);
    setEditFinalPrice(
      b.preferences?.finalQuotedPrice?.toString() ||
      b.preferences?.indicativeTotalPrice?.toString() ||
      ''
    );
    setEditNotes(b.preferences?.consultantNotes || '');
    setModalSuccess(null);
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSavingQuote(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          bookingStatus: editStatus,
          paymentStatus: editPaymentStatus,
          finalQuotedPrice: editFinalPrice ? parseFloat(editFinalPrice) : undefined,
          consultantNotes: editNotes.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalSuccess('Proposal updated successfully!');
        loadBookings();
        setTimeout(() => setSelectedBooking(null), 1500);
      }
    } catch {
      alert('Failed to save update.');
    } finally {
      setSavingQuote(false);
    }
  };

  const handleUpdateDepartureSeats = async (depId: string, delta: number, currentSeats: number) => {
    const newSeats = Math.max(0, Math.min(6, currentSeats + delta));
    try {
      const res = await fetch('/api/admin/departures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureId: depId,
          bookedSeats: newSeats,
          status: newSeats >= 6 ? 'sold_out' : newSeats >= 3 ? 'guaranteed' : 'available',
        }),
      });
      const json = await res.json();
      if (json.success) loadDepartures();
    } catch {
      alert('Failed to update departure.');
    }
  };

  // ── 1. Secret Passkey Login View ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--gs-obsidian)', padding: '24px' }}>
        <div style={{ background: 'var(--gs-white)', borderRadius: 'var(--radius-lg)', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="gs-brand-monogram" style={{ margin: '0 auto 12px' }}>G</div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--gs-forest)', margin: '0 0 4px' }}>Grafton Operations</h2>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--gs-gold-dark)' }}>
              AUTHENTICATED CONSULTANT PORTAL
            </span>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="gs-label required">Admin Secret Passkey</label>
              <input
                type="password"
                className="gs-input"
                placeholder="Enter secret passkey…"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoFocus
                required
              />
            </div>

            {authError && (
              <div className="gs-alert gs-alert-error">
                <span>⚠</span> <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="gs-btn gs-btn-gold gs-btn-full gs-btn-lg gs-glow-btn"
              disabled={authenticating}
            >
              {authenticating ? <span className="gs-spinner" /> : 'Unlock Operations Cockpit ➔'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '0.74rem', textAlign: 'center', color: 'var(--gs-text-muted)' }}>
            Default setup key: <code style={{ color: 'var(--gs-gold-dark)' }}>grafton-safari-admin-2027</code>
          </p>
        </div>
      </div>
    );
  }

  // ── 2. Authenticated Operations Cockpit ───────────────────────────────────
  return (
    <div className="gs-app-shell">
      {/* Header */}
      <header className="gs-editorial-header">
        <div className="gs-header-brand-wrap">
          <div className="gs-brand-monogram">G</div>
          <div className="gs-brand-titles">
            <h1>Grafton Safaris</h1>
            <span>Operations & Quotations Cockpit</span>
          </div>
        </div>

        <div className="gs-header-nav-actions">
          <button onClick={() => router.push('/')} className="gs-btn gs-btn-ghost-light gs-btn-sm">
            🌐 Live Safari Site
          </button>
          <button onClick={handleLogout} className="gs-btn gs-btn-ghost-light gs-btn-sm">
            🔒 Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Pipeline Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="gs-builder-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gs-text-muted)', fontWeight: 600 }}>
              Total Inquiries
            </span>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--gs-forest)', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>

          <div className="gs-builder-card" style={{ padding: '20px', borderLeft: '4px solid var(--gs-gold)' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gs-gold-dark)', fontWeight: 600 }}>
              Under Grafton Review
            </span>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--gs-forest)', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>

          <div className="gs-builder-card" style={{ padding: '20px', borderLeft: '4px solid var(--gs-success)' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gs-success)', fontWeight: 600 }}>
              Final Quotations Issued
            </span>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--gs-forest)', marginTop: '4px' }}>
              {stats.confirmed}
            </div>
          </div>

          <div className="gs-builder-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gs-text-muted)', fontWeight: 600 }}>
              Cancelled / Closed
            </span>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--gs-text-muted)', marginTop: '4px' }}>
              {stats.cancelled}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="gs-filter-tabs-header" style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`gs-tab-btn${activeTab === 'bookings' ? ' active' : ''}`}
          >
            📋 Safari Proposals & Bookings ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab('departures');
              loadDepartures();
            }}
            className={`gs-tab-btn${activeTab === 'departures' ? ' active' : ''}`}
          >
            🗓 Package 8 Fixed Departures ({departures.length})
          </button>
        </div>

        {/* ── TAB 1: Safari Bookings Pipeline ───────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="gs-builder-card" style={{ padding: '24px' }}>
            {/* Search & Filter Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'pending', 'confirmed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`gs-filter-pill${statusFilter === st ? ' active' : ''}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {st === 'pending' ? 'Under Review' : st === 'confirmed' ? 'Quote Issued' : st}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="gs-input"
                  style={{ width: '220px', padding: '6px 12px', fontSize: '0.84rem' }}
                  placeholder="Search guest or ref…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBookings()}
                />
                <button onClick={loadBookings} className="gs-btn gs-btn-gold gs-btn-sm">
                  Search
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="gs-spinner" style={{ margin: '0 auto 12px' }} />
                <p>Loading pipeline data…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gs-text-muted)' }}>
                No bookings found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gs-sand-dark)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Ref / Date</th>
                      <th style={{ padding: '12px 8px' }}>Guest Details</th>
                      <th style={{ padding: '12px 8px' }}>Journey</th>
                      <th style={{ padding: '12px 8px' }}>Party & Tier</th>
                      <th style={{ padding: '12px 8px' }}>Quoted Price</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--gs-sand-dark)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--gs-gold-dark)' }}>
                            {b.booking_reference}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                            {new Date(b.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <strong>{b.full_name}</strong>
                          <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>
                            {b.email} · {b.phone}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span>{b.travel_type}</span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                            {b.travel_duration}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span>{b.adults}A {b.children > 0 ? `+ ${b.children}C` : ''}</span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--gs-gold-dark)', fontWeight: 600 }}>
                            {b.preferences?.accommodationTier || 'Comfort'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'var(--font-editorial)', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gs-forest)' }}>
                          {b.preferences?.finalQuotedPrice
                            ? `$${b.preferences.finalQuotedPrice.toLocaleString()}`
                            : b.preferences?.indicativeTotalPrice
                            ? `$${b.preferences.indicativeTotalPrice.toLocaleString()}`
                            : 'Review'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            className="gs-badge-gold-sm"
                            style={{
                              background:
                                b.booking_status === 'confirmed' ? 'var(--gs-success)' :
                                b.booking_status === 'cancelled' ? 'var(--gs-error)' : 'var(--gs-gold)',
                              color: '#FFF',
                            }}
                          >
                            {b.booking_status === 'pending' ? 'Review Needed' : b.booking_status === 'confirmed' ? 'Quote Issued' : b.booking_status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => openBookingEditor(b)}
                            className="gs-btn gs-btn-gold gs-btn-sm"
                          >
                            Edit Quote ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Package 8 Fixed Departures Manager ─────────────────── */}
        {activeTab === 'departures' && (
          <div className="gs-builder-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--gs-forest)' }}>
              Package 8 (Northern Highlights Small Group) — Live Departure Seats
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', marginBottom: '20px' }}>
              Enforces strict maximum 6 guests per safari vehicle. Updates reflect live on the website calendar.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {departures.map((d) => {
                const available = d.max_capacity - d.booked_seats;
                return (
                  <div key={d.id} className="gs-builder-card" style={{ padding: '18px', background: 'var(--gs-sand)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="gs-badge-gold-sm">{d.status.toUpperCase()}</span>
                      <strong style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.15rem' }}>
                        ${d.price_per_person.toLocaleString()} pp
                      </strong>
                    </div>

                    <h4 style={{ margin: '4px 0', color: 'var(--gs-forest)' }}>
                      {new Date(d.departure_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ➔ {new Date(d.return_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </h4>

                    {/* Seat Dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '12px 0' }}>
                      {Array.from({ length: d.max_capacity }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: i < d.booked_seats ? 'var(--gs-error)' : 'var(--gs-success)',
                            display: 'inline-block',
                          }}
                          title={i < d.booked_seats ? 'Booked' : 'Available'}
                        />
                      ))}
                      <span style={{ fontSize: '0.82rem', marginLeft: '6px', fontWeight: 600 }}>
                        {available} of {d.max_capacity} Seats Left
                      </span>
                    </div>

                    {/* Quick Adjust Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>Adjust Booked:</span>
                      <div className="gs-stepper">
                        <button
                          onClick={() => handleUpdateDepartureSeats(d.id, -1, d.booked_seats)}
                          disabled={d.booked_seats <= 0}
                        >
                          -
                        </button>
                        <strong>{d.booked_seats}</strong>
                        <button
                          onClick={() => handleUpdateDepartureSeats(d.id, 1, d.booked_seats)}
                          disabled={d.booked_seats >= d.max_capacity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quotation Editor Modal ────────────────────────────────────── */}
        {selectedBooking && (
          <div className="gs-modal-backdrop" onClick={() => setSelectedBooking(null)}>
            <div
              className="gs-modal-compare-container"
              style={{ maxWidth: '680px', background: 'var(--gs-white)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gs-modal-header">
                <div>
                  <span className="gs-badge-gold">Consultant Review</span>
                  <h2>Edit Quotation & Proposal</h2>
                  <p>Reference: <strong>{selectedBooking.booking_reference}</strong> · {selectedBooking.full_name}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="gs-modal-close-btn">✕</button>
              </div>

              <form onSubmit={handleSaveQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--gs-sand)', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div><strong>Email:</strong> {selectedBooking.email} | <strong>Phone:</strong> {selectedBooking.phone}</div>
                  <div><strong>Journey:</strong> {selectedBooking.travel_type} ({selectedBooking.travel_duration})</div>
                  <div><strong>Party:</strong> {selectedBooking.adults} Adults, {selectedBooking.children} Children · {selectedBooking.preferences?.accommodationTier || 'Comfort'} Tier</div>
                  {selectedBooking.custom_message && (
                    <div style={{ marginTop: '8px', color: 'var(--gs-forest)' }}>
                      <strong>Client Note:</strong> "{selectedBooking.custom_message}"
                    </div>
                  )}
                </div>

                <div className="gs-form-row cols-2">
                  <div className="gs-field">
                    <label className="gs-label required">Proposal Status</label>
                    <select
                      className="gs-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="pending">Under Grafton Review (Pending)</option>
                      <option value="confirmed">Final Quotation Issued (Confirmed)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="gs-field">
                    <label className="gs-label required">Final Quoted Price (USD)</label>
                    <input
                      type="number"
                      className="gs-input"
                      value={editFinalPrice}
                      onChange={(e) => setEditFinalPrice(e.target.value)}
                      placeholder="e.g. 8450"
                      required
                    />
                  </div>
                </div>

                <div className="gs-field">
                  <label className="gs-label">Consultant Notes & Lodge Confirmation Details</label>
                  <textarea
                    className="gs-textarea"
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Sayari Camp confirmed for nights 6-8. Awaiting JRO transfer flight timing…"
                  />
                </div>

                {modalSuccess && (
                  <div className="gs-alert gs-alert-success">
                    <span>✓</span> <span>{modalSuccess}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="gs-btn gs-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gs-btn gs-btn-gold gs-glow-btn"
                    disabled={savingQuote}
                  >
                    {savingQuote ? <span className="gs-spinner" /> : 'Save & Issue Updated Proposal ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
