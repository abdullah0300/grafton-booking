'use client';
// src/components/StandardLeadForm.tsx
// Packages 1–7: Custom safari inquiry form (not fixed departure).
// Collects arrival date, duration preferences, and sends to /api/bookings/submit.

import { useState } from 'react';
import { BookingFormData } from '@/types/booking';

interface StandardLeadFormProps {
  packageId: number;
  packageTitle: string;
  leadId?: string;
  prefill?: {
    full_name?: string;
    email?: string;
    phone?: string;
    arrival_date?: string;
    duration?: string;
    adults?: number;
    children?: number;
  };
  onSuccess: (ref: string) => void;
}

const DURATIONS = [
  '3–4 Days', '5–6 Days', '7–8 Days', '9–10 Days', '11–14 Days', '15+ Days',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function StandardLeadForm({
  packageId,
  packageTitle,
  leadId,
  prefill,
  onSuccess,
}: StandardLeadFormProps) {
  const [form, setForm] = useState<Partial<BookingFormData>>({
    package_id: packageId,
    travel_type: packageTitle,
    lead_id: leadId,
    full_name: prefill?.full_name ?? '',
    email: prefill?.email ?? '',
    phone: prefill?.phone ?? '',
    arrival_date: prefill?.arrival_date ?? '',
    travel_duration: prefill?.duration ?? '',
    adults: prefill?.adults ?? 1,
    children: prefill?.children ?? 0,
    single_room_requested: false,
    gender: '',
    custom_message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof BookingFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.full_name?.trim()) errs.full_name = 'Full name is required.';
    if (!form.email?.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.phone?.trim()) errs.phone = 'Phone number is required.';
    if (!form.adults || form.adults < 1) errs.adults = 'At least 1 adult is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: BookingFormData = {
        package_id: packageId,
        travel_type: packageTitle,
        lead_id: leadId,
        full_name: form.full_name!.trim(),
        email: form.email!.trim().toLowerCase(),
        phone: form.phone!.trim(),
        gender: form.gender || undefined,
        arrival_date: form.arrival_date || undefined,
        travel_duration: form.travel_duration || undefined,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        single_room_requested: false,
        custom_message: form.custom_message?.trim() || undefined,
      };

      const res = await fetch('/api/bookings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess(json.data.booking_reference);
      } else {
        setSubmitError(json.error ?? 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPrefilled = (field: string) =>
    !!prefill?.[field as keyof typeof prefill];

  return (
    <form className="gs-form" onSubmit={handleSubmit} noValidate>
      {/* Contact Details */}
      <div className="gs-section-title">
        <h3>Contact Details</h3>
      </div>

      <div className="gs-form-row cols-2">
        <div className="gs-field">
          <label className="gs-label required" htmlFor="std-full-name">Full Name</label>
          <input
            id="std-full-name"
            type="text"
            className={`gs-input${isPrefilled('full_name') ? ' prefilled' : ''}`}
            value={form.full_name ?? ''}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.full_name && <span className="gs-field-error">{errors.full_name}</span>}
        </div>

        <div className="gs-field">
          <label className="gs-label" htmlFor="std-gender">Gender</label>
          <select
            id="std-gender"
            className="gs-select"
            value={form.gender ?? ''}
            onChange={(e) => set('gender', e.target.value)}
          >
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="gs-form-row cols-2">
        <div className="gs-field">
          <label className="gs-label required" htmlFor="std-email">Email Address</label>
          <input
            id="std-email"
            type="email"
            className={`gs-input${isPrefilled('email') ? ' prefilled' : ''}`}
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
          {errors.email && <span className="gs-field-error">{errors.email}</span>}
        </div>

        <div className="gs-field">
          <label className="gs-label required" htmlFor="std-phone">Phone Number</label>
          <input
            id="std-phone"
            type="tel"
            className={`gs-input${isPrefilled('phone') ? ' prefilled' : ''}`}
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            autoComplete="tel"
          />
          {errors.phone && <span className="gs-field-error">{errors.phone}</span>}
        </div>
      </div>

      {/* Safari Details */}
      <div className="gs-section-title">
        <h3>Safari Preferences</h3>
      </div>

      <div className="gs-form-row cols-2">
        <div className="gs-field">
          <label className="gs-label" htmlFor="std-arrival">Preferred Arrival</label>
          <input
            id="std-arrival"
            type="date"
            className={`gs-input${isPrefilled('arrival_date') ? ' prefilled' : ''}`}
            value={form.arrival_date ?? ''}
            onChange={(e) => set('arrival_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <span className="gs-hint">Approximate date is fine</span>
        </div>

        <div className="gs-field">
          <label className="gs-label" htmlFor="std-duration">Trip Duration</label>
          <select
            id="std-duration"
            className="gs-select"
            value={form.travel_duration ?? ''}
            onChange={(e) => set('travel_duration', e.target.value)}
          >
            <option value="">Select duration</option>
            {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="gs-form-row cols-2">
        <div className="gs-field">
          <label className="gs-label required" htmlFor="std-adults">Adults</label>
          <input
            id="std-adults"
            type="number"
            className="gs-input"
            min={1} max={20}
            value={form.adults ?? 1}
            onChange={(e) => set('adults', parseInt(e.target.value, 10))}
          />
          {errors.adults && <span className="gs-field-error">{errors.adults}</span>}
        </div>

        <div className="gs-field">
          <label className="gs-label" htmlFor="std-children">Children (Under 12)</label>
          <input
            id="std-children"
            type="number"
            className="gs-input"
            min={0} max={10}
            value={form.children ?? 0}
            onChange={(e) => set('children', parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      {/* Message */}
      <div className="gs-field">
        <label className="gs-label" htmlFor="std-message">Additional Notes</label>
        <textarea
          id="std-message"
          className="gs-textarea"
          value={form.custom_message ?? ''}
          onChange={(e) => set('custom_message', e.target.value)}
          placeholder="Special requirements, dietary needs, accessibility concerns, anniversary celebrations…"
          rows={4}
        />
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
        className="gs-btn gs-btn-primary gs-btn-full gs-btn-lg"
        disabled={submitting}
        id="std-form-submit"
      >
        {submitting ? (
          <>
            <span className="gs-spinner" aria-hidden="true" />
            Sending Inquiry…
          </>
        ) : (
          'Send My Safari Inquiry →'
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.78rem' }}>
        No payment required now. Our team will confirm all details with you directly.
      </p>
    </form>
  );
}
