'use client';
// src/components/BookingFormContainer.tsx
// Main orchestrator — reads ?package=N&leadId=XXX, fetches pre-fill data server-side,
// renders either the Fixed Departure form (Package 8) or Standard Lead form (Packages 1–7).
// Manages the confirmation state and postMessage integration.

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FixedDeparture, LeadPrefillResponse } from '@/types/booking';
import FixedDepartureCalendar from './FixedDepartureCalendar';
import StandardLeadForm from './StandardLeadForm';
import ConfirmationCard from './ConfirmationCard';

const PACKAGES: Record<number, { title: string; duration: string; isFixed: boolean }> = {
  1: { title: 'Kenya Masai Mara Safari', duration: '7 Days', isFixed: false },
  2: { title: 'Tanzania Serengeti & Ngorongoro', duration: '8 Days', isFixed: false },
  3: { title: 'Amboseli & Kilimanjaro Views', duration: '5 Days', isFixed: false },
  4: { title: 'Uganda Gorilla Trekking', duration: '6 Days', isFixed: false },
  5: { title: 'Rwanda Primate Safari', duration: '5 Days', isFixed: false },
  6: { title: 'Botswana Okavango Delta', duration: '9 Days', isFixed: false },
  7: { title: 'South Africa Classic Safari', duration: '10 Days', isFixed: false },
  8: { title: 'Northern Highlights Small Group', duration: '11 Days', isFixed: true },
};

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

interface Package8FormState {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  adults: number;
  children: number;
  custom_message: string;
}

export default function BookingFormContainer() {
  const searchParams = useSearchParams();
  const packageIdStr = searchParams.get('package');
  const leadId = searchParams.get('leadId') ?? undefined;

  const packageId = parseInt(packageIdStr ?? '8', 10);
  const pkg = PACKAGES[packageId] ?? PACKAGES[8];

  // Pre-fill state
  const [prefill, setPrefill] = useState<LeadPrefillResponse | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Package 8 specific state
  const [selectedDeparture, setSelectedDeparture] = useState<FixedDeparture | null>(null);
  const [singleSupplement, setSingleSupplement] = useState(false);

  // Package 8 contact form state
  const [p8Form, setP8Form] = useState<Package8FormState>({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    adults: 1,
    children: 0,
    custom_message: '',
  });
  const [p8Errors, setP8Errors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confirmation state
  const [confirmed, setConfirmed] = useState<{
    reference: string;
    guestName: string;
    departureDate?: string;
  } | null>(null);

  // ── Fetch Lead Pre-fill ──────────────────────────────────────────────────
  const fetchPrefill = useCallback(async () => {
    if (!leadId) return;
    setPrefillLoading(true);
    try {
      const res = await fetch(`/api/leads?leadId=${encodeURIComponent(leadId)}`);
      const json = await res.json();
      if (json.success && json.data && Object.keys(json.data).length > 0) {
        const data: LeadPrefillResponse = json.data;
        setPrefill(data);
        setIsPrefilled(true);
        // Pre-fill Package 8 form
        setP8Form((prev) => ({
          ...prev,
          full_name: data.full_name ?? prev.full_name,
          email: data.email ?? prev.email,
          phone: data.phone ?? prev.phone,
          adults: data.adults ?? prev.adults,
          children: data.children ?? prev.children,
        }));
      }
    } catch {
      // Silent — operate in standalone mode
    } finally {
      setPrefillLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchPrefill();
  }, [fetchPrefill]);

  // ── Package 8 Submit Handler ─────────────────────────────────────────────
  const validateP8 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!p8Form.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!p8Form.email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p8Form.email)) errs.email = 'Enter a valid email.';
    if (!p8Form.phone.trim()) errs.phone = 'Phone number is required.';
    if (!selectedDeparture) errs.departure = 'Please select a departure date.';
    if (p8Form.adults < 1) errs.adults = 'At least 1 adult is required.';
    setP8Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleP8Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateP8()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/bookings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: 8,
          travel_type: 'Northern Highlights Small Group',
          departure_id: selectedDeparture!.id,
          lead_id: leadId,
          full_name: p8Form.full_name.trim(),
          email: p8Form.email.trim().toLowerCase(),
          phone: p8Form.phone.trim(),
          gender: p8Form.gender || undefined,
          date_of_birth: p8Form.date_of_birth || undefined,
          adults: p8Form.adults,
          children: p8Form.children,
          single_room_requested: singleSupplement,
          custom_message: p8Form.custom_message.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setConfirmed({
          reference: json.data.booking_reference,
          guestName: p8Form.full_name,
          departureDate: selectedDeparture?.departure_date,
        });
      } else {
        setSubmitError(json.error ?? 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const setP8Field = (field: keyof Package8FormState, value: unknown) => {
    setP8Form((prev) => ({ ...prev, [field]: value }));
    setP8Errors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Confirmed state ──────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="gs-card">
        <ConfirmationCard
          bookingReference={confirmed.reference}
          guestName={confirmed.guestName}
          packageTitle={pkg.title}
          departureDate={confirmed.departureDate}
        />
      </div>
    );
  }

  // ── Package 1–7: Standard Lead Form ─────────────────────────────────────
  if (!pkg.isFixed) {
    return (
      <div className="gs-card">
        <div className="gs-card-header">
          <h2>{pkg.title}</h2>
          <p>{pkg.duration} Safari Experience</p>
        </div>
        <div className="gs-card-body">
          {isPrefilled && (
            <div className="gs-prefill-banner" style={{ marginBottom: 'var(--space-lg)' }}>
              <span>✨</span>
              <span>We've pre-filled your details from your safari preferences. Review and submit when ready.</span>
            </div>
          )}
          <StandardLeadForm
            packageId={packageId}
            packageTitle={pkg.title}
            leadId={leadId}
            prefill={prefill ?? undefined}
            onSuccess={(ref) => setConfirmed({ reference: ref, guestName: p8Form.full_name || 'Traveler' })}
          />
        </div>
      </div>
    );
  }

  // ── Package 8: Fixed Departure Form ─────────────────────────────────────
  return (
    <div className="gs-card">
      <div className="gs-card-header">
        <h2>Northern Highlights Small Group</h2>
        <p>11-Day Fixed Departure — Max 6 Guests per Vehicle</p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="gs-badge gs-badge-available">Small Group</span>
          <span className="gs-badge" style={{ background: 'rgba(212,175,107,0.2)', color: 'var(--gs-gold)' }}>
            From $4,950 / person
          </span>
        </div>
      </div>

      <div className="gs-card-body">
        {prefillLoading && (
          <div className="gs-prefill-banner" style={{ marginBottom: 'var(--space-lg)' }}>
            <span className="gs-spinner" style={{ color: 'var(--gs-forest)' }} />
            <span>Loading your saved preferences…</span>
          </div>
        )}

        {isPrefilled && !prefillLoading && (
          <div className="gs-prefill-banner" style={{ marginBottom: 'var(--space-lg)' }}>
            <span>✨</span>
            <span>We've pre-filled your details from your safari questionnaire.</span>
          </div>
        )}

        <form className="gs-form" onSubmit={handleP8Submit} noValidate>
          {/* Step 1: Choose Departure */}
          <FixedDepartureCalendar
            selectedDepartureId={selectedDeparture?.id ?? null}
            onSelect={setSelectedDeparture}
            singleSupplement={singleSupplement}
            onToggleSupplement={setSingleSupplement}
            adults={p8Form.adults}
            children={p8Form.children}
          />
          {p8Errors.departure && (
            <span className="gs-field-error" role="alert">{p8Errors.departure}</span>
          )}

          {/* Step 2: Guest Count */}
          <div>
            <div className="gs-section-title">
              <h3>Guest Count</h3>
            </div>
            <div className="gs-form-row cols-2">
              <div className="gs-field">
                <label className="gs-label required" htmlFor="p8-adults">Adults</label>
                <input
                  id="p8-adults"
                  type="number"
                  className="gs-input"
                  min={1}
                  max={6}
                  value={p8Form.adults}
                  onChange={(e) => setP8Field('adults', Math.min(6, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                />
                {p8Errors.adults && <span className="gs-field-error">{p8Errors.adults}</span>}
                <span className="gs-hint">Maximum 6 guests per vehicle</span>
              </div>
              <div className="gs-field">
                <label className="gs-label" htmlFor="p8-children">Children (Under 12)</label>
                <input
                  id="p8-children"
                  type="number"
                  className="gs-input"
                  min={0}
                  max={5}
                  value={p8Form.children}
                  onChange={(e) => setP8Field('children', Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Contact */}
          <div>
            <div className="gs-section-title">
              <h3>Your Details</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="gs-form-row cols-2">
                <div className="gs-field">
                  <label className="gs-label required" htmlFor="p8-name">Full Name</label>
                  <input
                    id="p8-name"
                    type="text"
                    className={`gs-input${prefill?.full_name ? ' prefilled' : ''}`}
                    value={p8Form.full_name}
                    onChange={(e) => setP8Field('full_name', e.target.value)}
                    placeholder="As per passport"
                    autoComplete="name"
                  />
                  {p8Errors.full_name && <span className="gs-field-error">{p8Errors.full_name}</span>}
                </div>

                <div className="gs-field">
                  <label className="gs-label" htmlFor="p8-gender">Gender</label>
                  <select
                    id="p8-gender"
                    className="gs-select"
                    value={p8Form.gender}
                    onChange={(e) => setP8Field('gender', e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="gs-form-row cols-2">
                <div className="gs-field">
                  <label className="gs-label required" htmlFor="p8-email">Email Address</label>
                  <input
                    id="p8-email"
                    type="email"
                    className={`gs-input${prefill?.email ? ' prefilled' : ''}`}
                    value={p8Form.email}
                    onChange={(e) => setP8Field('email', e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                  {p8Errors.email && <span className="gs-field-error">{p8Errors.email}</span>}
                </div>

                <div className="gs-field">
                  <label className="gs-label required" htmlFor="p8-phone">Phone Number</label>
                  <input
                    id="p8-phone"
                    type="tel"
                    className={`gs-input${prefill?.phone ? ' prefilled' : ''}`}
                    value={p8Form.phone}
                    onChange={(e) => setP8Field('phone', e.target.value)}
                    placeholder="+1 555 000 0000"
                    autoComplete="tel"
                  />
                  {p8Errors.phone && <span className="gs-field-error">{p8Errors.phone}</span>}
                </div>
              </div>

              <div className="gs-field" style={{ maxWidth: '260px' }}>
                <label className="gs-label" htmlFor="p8-dob">Date of Birth</label>
                <input
                  id="p8-dob"
                  type="date"
                  className="gs-input"
                  value={p8Form.date_of_birth}
                  onChange={(e) => setP8Field('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <span className="gs-hint">Optional — required for some park permits</span>
              </div>

              <div className="gs-field">
                <label className="gs-label" htmlFor="p8-message">Special Requests</label>
                <textarea
                  id="p8-message"
                  className="gs-textarea"
                  value={p8Form.custom_message}
                  onChange={(e) => setP8Field('custom_message', e.target.value)}
                  placeholder="Dietary requirements, accessibility needs, celebrating a special occasion…"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="gs-alert gs-alert-error" role="alert">
              <span>⚠</span>
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            className="gs-btn gs-btn-gold gs-btn-full gs-btn-lg"
            disabled={submitting}
            id="p8-form-submit"
          >
            {submitting ? (
              <>
                <span className="gs-spinner" aria-hidden="true" />
                Reserving Your Seats…
              </>
            ) : (
              'Reserve My Seats →'
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.78rem' }}>
            No payment required now. Your seats will be held pending confirmation from our team.
          </p>
        </form>
      </div>
    </div>
  );
}
