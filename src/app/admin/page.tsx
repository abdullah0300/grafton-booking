'use client';
// src/app/admin/page.tsx
// Grafton Safaris — High-End Admin Operations Cockpit & Quotation Manager

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SAFARI_PACKAGES, GLOBAL_ADDONS } from '@/data/packages';

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
        setAuthError(json.error || 'Authentication failed. Please check passkey.');
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
        setTimeout(() => setSelectedBooking(null), 1200);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="gs-portal-status-badge is-confirmed">✓ Final Quote Issued</span>;
      case 'cancelled':
        return <span className="gs-portal-status-badge is-cancelled">✕ Cancelled</span>;
      case 'pending':
      default:
        return <span className="gs-portal-status-badge is-pending">⏳ Under Review</span>;
    }
  };

  // ── 1. Secret Passkey Login View ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="gs-admin-login-shell">
        <div className="gs-admin-login-card">
          <div className="gs-admin-login-brand">
            <div className="gs-portal-logo-mark">G</div>
            <h2 className="gs-admin-login-title">Grafton Operations</h2>
            <span className="gs-badge-olive">Safari Specialist Cockpit</span>
          </div>

          <form onSubmit={handleLogin} className="gs-admin-login-form">
            <div className="gs-field">
              <label className="gs-label required">Admin Passkey</label>
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
              className="gs-btn-orange"
              style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
              disabled={authenticating}
            >
              {authenticating ? 'Authenticating…' : 'Unlock Operations Cockpit ➔'}
            </button>
          </form>

          <p className="gs-admin-login-hint">
            Default passkey: <code>grafton-safari-admin-2027</code>
          </p>
        </div>
      </div>
    );
  }

  // ── 2. Authenticated Operations Cockpit ───────────────────────────────────
  return (
    <div className="gs-portal-page-shell">
      {/* Header */}
      <header className="gs-portal-header">
        <div className="gs-portal-header-inner">
          <div className="gs-portal-brand">
            <div className="gs-portal-logo-mark">G</div>
            <div className="gs-portal-brand-text">
              <span className="gs-portal-brand-title">GRAFTON SAFARIS</span>
              <span className="gs-portal-brand-subtitle">Operations &amp; Quotations Cockpit</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => router.push('/')} className="gs-btn-portal-back">
              🌐 Live Safari Site
            </button>
            <button onClick={handleLogout} className="gs-btn-portal-back">
              🔒 Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="gs-portal-main">
        {/* KPI Metrics Banner */}
        <section className="gs-admin-kpis-grid">
          <div className="gs-admin-kpi-card">
            <span className="gs-admin-kpi-label">Total Inquiries</span>
            <span className="gs-admin-kpi-val">{stats.total}</span>
            <span className="gs-admin-kpi-sub">All logged traveler leads</span>
          </div>

          <div className="gs-admin-kpi-card is-pending">
            <span className="gs-admin-kpi-label">Under Grafton Review</span>
            <span className="gs-admin-kpi-val">{stats.pending}</span>
            <span className="gs-admin-kpi-sub">Awaiting specialist quote</span>
          </div>

          <div className="gs-admin-kpi-card is-confirmed">
            <span className="gs-admin-kpi-label">Final Quotes Issued</span>
            <span className="gs-admin-kpi-val">{stats.confirmed}</span>
            <span className="gs-admin-kpi-sub">Proposals with confirmed price</span>
          </div>

          <div className="gs-admin-kpi-card">
            <span className="gs-admin-kpi-label">Cancelled / Closed</span>
            <span className="gs-admin-kpi-val">{stats.cancelled}</span>
            <span className="gs-admin-kpi-sub">Archived or unavailable</span>
          </div>
        </section>

        {/* View Capsule Switcher */}
        <div className="gs-hero-capsule-container" style={{ margin: '0 0 24px 0' }}>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`gs-hero-capsule-btn${activeTab === 'bookings' ? ' active' : ''}`}
          >
            📋 Safari Proposals &amp; Bookings ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab('departures');
              loadDepartures();
            }}
            className={`gs-hero-capsule-btn${activeTab === 'departures' ? ' active' : ''}`}
          >
            🗓 Package 8 Group Departures ({departures.length})
          </button>
        </div>

        {/* ── TAB 1: Safari Bookings Pipeline ───────────────────────────── */}
        {activeTab === 'bookings' && (
          <section className="gs-portal-card">
            {/* Toolbar */}
            <div className="gs-admin-toolbar">
              <div className="gs-pill-cluster">
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
                <button onClick={loadBookings} className="gs-btn-orange" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                  Search
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gs-text-muted)' }}>
                Loading pipeline data…
              </div>
            ) : bookings.length === 0 ? (
              <div className="gs-portal-empty-card" style={{ margin: '20px 0' }}>
                <div className="gs-portal-empty-icon">📂</div>
                <h4 className="gs-portal-empty-title">No Inquiries Found</h4>
                <p className="gs-portal-empty-desc">No customer proposals match the current filter criteria.</p>
              </div>
            ) : (
              <div className="gs-admin-table-wrap">
                <table className="gs-admin-table">
                  <thead>
                    <tr>
                      <th>Ref &amp; Date</th>
                      <th>Traveler Details</th>
                      <th>Safari Journey</th>
                      <th>Party &amp; Standard</th>
                      <th>Quoted Rate</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span className="gs-admin-ref-code">{b.booking_reference}</span>
                          <span className="gs-admin-date-sub">{new Date(b.created_at).toLocaleDateString()}</span>
                        </td>
                        <td>
                          <span className="gs-admin-guest-name">{b.full_name}</span>
                          <span className="gs-admin-guest-contact">{b.email} · {b.phone}</span>
                        </td>
                        <td>
                          <span className="gs-admin-journey-title">{b.travel_type}</span>
                          <span className="gs-admin-date-sub">{b.travel_duration}</span>
                        </td>
                        <td>
                          <span>{b.adults} Adults{b.children > 0 ? `, ${b.children} Child` : ''}</span>
                          <span className="gs-admin-tier-badge">{b.preferences?.accommodationTier || 'Comfort'} Tier</span>
                        </td>
                        <td>
                          <span className="gs-admin-price-text">
                            {b.preferences?.finalQuotedPrice
                              ? `$${b.preferences.finalQuotedPrice.toLocaleString()}`
                              : b.preferences?.indicativeTotalPrice
                              ? `$${b.preferences.indicativeTotalPrice.toLocaleString()}`
                              : 'Under Review'}
                          </span>
                        </td>
                        <td>
                          {b.booking_status === 'confirmed' ? (
                            <span className="gs-portal-status-badge is-confirmed">Quote Issued</span>
                          ) : b.booking_status === 'cancelled' ? (
                            <span className="gs-portal-status-badge is-cancelled">Cancelled</span>
                          ) : (
                            <span className="gs-portal-status-badge is-pending">Under Review</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => openBookingEditor(b)}
                            className="gs-btn-orange"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Review &amp; Edit ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── TAB 2: Package 8 Fixed Departures Manager ─────────────────── */}
        {activeTab === 'departures' && (
          <section className="gs-portal-card">
            <div className="gs-portal-card-header">
              <h3 className="gs-portal-card-title">Northern Highlights Small Group — Live Departure Inventory</h3>
              <p className="gs-portal-card-desc">Strict maximum 6 guests per safari vehicle. Updates synchronize in real time with the website booking engine.</p>
            </div>

            <div className="gs-admin-departures-grid">
              {departures.map((d) => {
                const available = d.max_capacity - d.booked_seats;
                return (
                  <div key={d.id} className="gs-admin-departure-card">
                    <div className="gs-admin-dep-header">
                      <span className="gs-badge-olive">{d.status.toUpperCase()}</span>
                      <span className="gs-admin-dep-price">${d.price_per_person.toLocaleString()} pp</span>
                    </div>

                    <h4 className="gs-admin-dep-dates">
                      {new Date(d.departure_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ➔ {new Date(d.return_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </h4>

                    {/* Seat Dots */}
                    <div className="gs-admin-seats-row">
                      {Array.from({ length: d.max_capacity }).map((_, i) => (
                        <span
                          key={i}
                          className={`gs-seat-dot${i < d.booked_seats ? ' is-booked' : ' is-available'}`}
                          title={i < d.booked_seats ? 'Booked' : 'Available'}
                        />
                      ))}
                      <span className="gs-admin-seats-count">
                        {available} of {d.max_capacity} Seats Available
                      </span>
                    </div>

                    {/* Capacity Stepper */}
                    <div className="gs-admin-dep-stepper-row">
                      <span style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>Adjust Booked Seats:</span>
                      <div className="gs-stepper">
                        <button
                          onClick={() => handleUpdateDepartureSeats(d.id, -1, d.booked_seats)}
                          disabled={d.booked_seats <= 0}
                        >
                          -
                        </button>
                        <span className="gs-stepper-val">{d.booked_seats}</span>
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
          </section>
        )}

        {/* ── Quotation Editor Modal ────────────────────────────────────── */}
        {selectedBooking && (() => {
          const selectedAddonObjects = (selectedBooking.preferences?.selectedAddonIds || [])
            .map((id) => GLOBAL_ADDONS.find((a) => a.id === id))
            .filter(Boolean);

          const indicativeTotal = selectedBooking.preferences?.indicativeTotalPrice;
          const indicativePerPerson = selectedBooking.preferences?.indicativePricePerPerson;
          const cleanPhone = selectedBooking.phone.replace(/[^0-9+]/g, '');
          const waPhone = cleanPhone.replace('+', '');

          return (
            <div className="gs-modal-backdrop" onClick={() => setSelectedBooking(null)}>
              <div
                className="gs-admin-review-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="gs-admin-review-modal-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="gs-badge-olive">Traveler Proposal Dossier</span>
                      <span className="gs-admin-ref-code">{selectedBooking.booking_reference}</span>
                      {getStatusBadge(selectedBooking.booking_status)}
                    </div>
                    <h2 className="gs-admin-review-modal-title">
                      {selectedBooking.full_name} · {selectedBooking.travel_type}
                    </h2>
                    <p className="gs-admin-review-modal-sub">
                      Submitted on {new Date(selectedBooking.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="gs-modal-close-btn" aria-label="Close modal">✕</button>
                </div>

                <form onSubmit={handleSaveQuotation} className="gs-admin-review-modal-body">
                  {/* Section 1: Guest Contact & Instant Reach Actions */}
                  <div className="gs-admin-dossier-contact-bar">
                    <div className="gs-admin-contact-item">
                      <span className="gs-admin-contact-label">Email Address</span>
                      <a href={`mailto:${selectedBooking.email}?subject=Grafton Safaris Proposal: ${selectedBooking.booking_reference}`} className="gs-admin-contact-link">
                        ✉ {selectedBooking.email}
                      </a>
                    </div>
                    <div className="gs-admin-contact-item">
                      <span className="gs-admin-contact-label">Phone &amp; WhatsApp</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <a href={`tel:${cleanPhone}`} className="gs-admin-contact-link">
                          📞 {selectedBooking.phone}
                        </a>
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${selectedBooking.full_name}, this is Grafton Safaris regarding your safari proposal ${selectedBooking.booking_reference}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gs-admin-wa-btn"
                          title="Open WhatsApp chat"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Complete Submitted Specifications Grid */}
                  <div className="gs-admin-dossier-grid">
                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Target Departure Date</span>
                      <span className="gs-admin-dossier-val">
                        {selectedBooking.arrival_date
                          ? new Date(selectedBooking.arrival_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Dates flexible'}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Preferred Season / Month</span>
                      <span className="gs-admin-dossier-val">
                        {selectedBooking.preferences?.travelMonth || 'Flexible Season'}
                        {selectedBooking.preferences?.season ? ` (${selectedBooking.preferences.season})` : ''}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Party Breakdown</span>
                      <span className="gs-admin-dossier-val">
                        {selectedBooking.adults} Adults{selectedBooking.children > 0 ? `, ${selectedBooking.children} Children` : ''}
                        {selectedBooking.single_room_requested ? ' · Single Room Requested' : ''}
                      </span>
                    </div>

                    <div className="gs-admin-dossier-cell">
                      <span className="gs-admin-dossier-label">Accommodation Standard</span>
                      <span className="gs-admin-dossier-val" style={{ color: 'var(--gs-olive)' }}>
                        ★ {selectedBooking.preferences?.accommodationTier || 'Comfort'} Tier
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Selected Add-On Experiences */}
                  <div className="gs-admin-dossier-addons-block">
                    <span className="gs-admin-dossier-section-title">
                      Selected Add-On Experiences ({selectedAddonObjects.length})
                    </span>
                    {selectedAddonObjects.length === 0 ? (
                      <p className="gs-admin-addons-empty">No optional add-ons selected by traveler.</p>
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

                  {/* Section 4: Client Special Requests / Message */}
                  {selectedBooking.custom_message && (
                    <div className="gs-admin-client-note-card">
                      <span className="gs-admin-client-note-label">💬 Traveler's Custom Request &amp; Notes:</span>
                      <p className="gs-admin-client-note-quote">"{selectedBooking.custom_message}"</p>
                    </div>
                  )}

                  {/* Section 5: Commercial Review & Quotation Adjustment */}
                  <div className="gs-admin-quotation-edit-section">
                    <div className="gs-admin-pricing-benchmarks">
                      <div>
                        <span className="gs-admin-bench-label">Indicative Client Estimate</span>
                        <span className="gs-admin-bench-val">
                          {indicativeTotal ? `$${indicativeTotal.toLocaleString()}` : 'N/A'}
                        </span>
                        {indicativePerPerson && (
                          <span className="gs-admin-bench-sub">(${indicativePerPerson.toLocaleString()} pp)</span>
                        )}
                      </div>
                      <div>
                        <span className="gs-admin-bench-label">Current Final Quote</span>
                        <span className="gs-admin-bench-val" style={{ color: '#2E7D52' }}>
                          {editFinalPrice ? `$${Number(editFinalPrice).toLocaleString()}` : '$0'}
                        </span>
                        {editFinalPrice && (
                          <span className="gs-admin-bench-sub">
                            (${Math.round(Number(editFinalPrice) / (selectedBooking.adults + selectedBooking.children || 1)).toLocaleString()} pp)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="gs-form-row cols-2" style={{ marginTop: '16px' }}>
                      <div className="gs-field">
                        <label className="gs-label required">Proposal Status</label>
                        <select
                          className="gs-select"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <option value="pending">⏳ Under Grafton Review (Pending)</option>
                          <option value="confirmed">✓ Final Quotation Issued (Confirmed)</option>
                          <option value="cancelled">✕ Cancelled</option>
                        </select>
                      </div>

                      <div className="gs-field">
                        <label className="gs-label required">Final Quoted Investment (USD)</label>
                        <input
                          type="number"
                          className="gs-input"
                          value={editFinalPrice}
                          onChange={(e) => setEditFinalPrice(e.target.value)}
                          placeholder="e.g. 24384"
                          required
                        />
                      </div>
                    </div>

                    <div className="gs-field" style={{ marginTop: '14px' }}>
                      <label className="gs-label">
                        Consultant Feedback &amp; Lodge Confirmation Message (Visible to Guest in Portal)
                      </label>
                      <textarea
                        className="gs-textarea"
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="e.g. Sayari Camp confirmed for nights 4-6. Upgraded Land Cruiser with photography beanbags included. Awaiting flight confirmation…"
                      />
                    </div>
                  </div>

                  {modalSuccess && (
                    <div className="gs-alert gs-alert-success" style={{ background: 'rgba(46, 125, 82, 0.1)', color: '#2E7D52', borderColor: 'rgba(46, 125, 82, 0.3)' }}>
                      <span>✓</span> <span>{modalSuccess}</span>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="gs-admin-modal-footer">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="gs-btn-portal-back"
                    >
                      Close / Discard
                    </button>
                    <button
                      type="submit"
                      className="gs-btn-orange"
                      style={{ padding: '12px 28px', fontSize: '0.9rem' }}
                      disabled={savingQuote}
                    >
                      {savingQuote ? 'Issuing Updated Proposal…' : 'Save & Issue Updated Proposal ➔'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
