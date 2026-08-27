'use client';
// src/components/builder/ItineraryBuilder.tsx
// Master Interactive Safari Trip Planner & Builder for Grafton Safaris

import { useState, useMemo, useEffect } from 'react';
import { SafariPackage, GLOBAL_ADDONS } from '@/data/packages';
import { calculateItineraryPrice } from '@/lib/pricingEngine';
import { saveItineraryDraft, generateShareableUrl } from '@/lib/draftStorage';
import InteractiveRouteMap from '@/components/maps/InteractiveRouteMap';
import DailyItineraryTimeline from './DailyItineraryTimeline';
import AccommodationSelector from './AccommodationSelector';
import AddonSelector from './AddonSelector';
import FixedDepartureCalendar from '@/components/FixedDepartureCalendar';
import ConfirmationCard from '@/components/ConfirmationCard';
import { DiscoveryFilterState } from '@/components/filter/DiscoveryFilterDrawer';

interface ItineraryBuilderProps {
  packageData: SafariPackage;
  onBackToCatalogue?: () => void;
  initialLeadId?: string;
  initialFilters?: DiscoveryFilterState;
}

export default function ItineraryBuilder({
  packageData,
  onBackToCatalogue,
  initialLeadId,
  initialFilters,
}: ItineraryBuilderProps) {
  // Builder Configuration State — pre-populated from Discovery Filter Drawer if provided
  const [adults, setAdults] = useState<number>(initialFilters?.adults || 2);
  const [children, setChildren] = useState<number>(initialFilters?.children || 0);
  const [singleRooms, setSingleRooms] = useState<number>(0);
  const [travelDate, setTravelDate] = useState<string>('');
  const [travelMonth, setTravelMonth] = useState<string>(
    initialFilters?.travelMonth || packageData.bestMonths[0]?.split(' ')[0] || 'August'
  );
  const [accommodationTier, setAccommodationTier] = useState<'Comfort' | 'Signature' | 'Reserve'>(
    (initialFilters?.comfortLevels?.[0] as any) || 'Comfort'
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [activeMapDay, setActiveMapDay] = useState<number>(1);

  // Package 8 specific state
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);
  const [singleSupplementP8, setSingleSupplementP8] = useState<boolean>(false);

  // Modals & UI States
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [draftToast, setDraftToast] = useState<string | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Subnav Sticky Scroll Animation & Active Section
  const [isSubnavSticky, setIsSubnavSticky] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('about');

  useEffect(() => {
    const handleScroll = () => {
      setIsSubnavSticky(window.scrollY > 520);

      const sectionIds = ['about', 'inclusions', 'special', 'program', 'cuisine', 'stays', 'route', 'addons'];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 180) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Contact Form for Final Quotation
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Confirmation Success State
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);

  // ── Real-time Pricing Calculation ────────────────────────────────────────
  const calculation = useMemo(() => {
    return calculateItineraryPrice({
      packageData,
      travelDate: travelDate || undefined,
      travelMonth,
      adults,
      children,
      singleRooms: packageData.isFixedDeparture ? (singleSupplementP8 ? 1 : 0) : singleRooms,
      accommodationTier,
      selectedAddonIds,
      allAddons: GLOBAL_ADDONS,
    });
  }, [
    packageData,
    travelDate,
    travelMonth,
    adults,
    children,
    singleRooms,
    singleSupplementP8,
    accommodationTier,
    selectedAddonIds,
  ]);

  // ── Toggle Add-on ────────────────────────────────────────────────────────
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // ── Save 30-Day Anonymous Draft ──────────────────────────────────────────
  const handleSaveDraft = () => {
    const saved = saveItineraryDraft({
      packageId: packageData.id,
      packageTitle: packageData.title,
      travelDate: travelDate || undefined,
      travelMonth,
      adults,
      children,
      rooms: {
        doubleRooms: Math.floor(adults / 2),
        twinRooms: 0,
        singleRooms,
        familyRooms: children > 0 ? 1 : 0,
      },
      accommodationTier,
      transportPreference: packageData.tags.transportPreference,
      pace: packageData.tags.pace,
      selectedAddonIds,
      customNotes: customMessage,
      indicativePricePerPerson: calculation.indicativePricePerPerson,
      indicativeTotalPrice: calculation.indicativeTotalPrice,
      currency: 'USD',
    });

    setDraftToast(`Draft saved! (Valid for 30 days — Ref: ${saved.id.slice(0, 12)})`);
    setTimeout(() => setDraftToast(null), 4000);
  };

  // ── Share Link ───────────────────────────────────────────────────────────
  const handleShareLink = () => {
    const url = generateShareableUrl({
      id: 'share',
      packageId: packageData.id,
      packageTitle: packageData.title,
      createdAt: '',
      updatedAt: '',
      expiresAt: '',
      travelDate: travelDate || undefined,
      travelMonth,
      adults,
      children,
      rooms: { doubleRooms: 1, twinRooms: 0, singleRooms, familyRooms: 0 },
      accommodationTier,
      transportPreference: packageData.tags.transportPreference,
      pace: packageData.tags.pace,
      selectedAddonIds,
      indicativePricePerPerson: calculation.indicativePricePerPerson,
      indicativeTotalPrice: calculation.indicativeTotalPrice,
      currency: 'USD',
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  // ── Submit for Final Quotation (Supabase) ─────────────────────────────────
  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setQuoteError('Please fill in your name, email, and phone number.');
      return;
    }

    setSubmittingQuote(true);
    setQuoteError(null);

    try {
      const payload = {
        package_id: packageData.id,
        travel_type: packageData.title,
        departure_id: packageData.isFixedDeparture ? selectedDepartureId : undefined,
        lead_id: initialLeadId,
        full_name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phone: contactPhone.trim(),
        arrival_date: travelDate || undefined,
        travel_duration: `${packageData.durationDays} Days / ${packageData.durationNights} Nights`,
        adults,
        children,
        single_room_requested: singleRooms > 0 || singleSupplementP8,
        custom_message: customMessage.trim() || undefined,
        preferences: {
          accommodationTier,
          travelMonth,
          selectedAddonIds,
          indicativePricePerPerson: calculation.indicativePricePerPerson,
          indicativeTotalPrice: calculation.indicativeTotalPrice,
          season: calculation.season,
        },
      };

      const res = await fetch('/api/bookings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setConfirmedBookingRef(json.data.booking_reference);
        setShowQuoteModal(false);
      } else {
        setQuoteError(json.error || 'Submission failed. Please try again.');
      }
    } catch {
      setQuoteError('Network error. Please try again.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // ── Confirmation Card State ──────────────────────────────────────────────
  if (confirmedBookingRef) {
    return (
      <div className="gs-card">
        <ConfirmationCard
          bookingReference={confirmedBookingRef}
          guestName={contactName}
          packageTitle={packageData.title}
          departureDate={travelDate || undefined}
          onClose={() => setConfirmedBookingRef(null)}
        />
      </div>
    );
  }

  // Print View State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  return (
    <div className="gs-explore-page-wrapper">
      {/* Draft Notification Toast */}
      {draftToast && (
        <div className="gs-draft-toast">
          <span>{draftToast}</span>
        </div>
      )}

      {/* ── Top Breadcrumbs & Back Navigation ─────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div className="gs-explore-breadcrumbs">
          <a href="https://grafton-public-website.vercel.app">Home</a>
          <span>·</span>
          {onBackToCatalogue ? (
            <button
              onClick={onBackToCatalogue}
              style={{ background: 'none', border: 'none', color: 'var(--gs-olive)', cursor: 'pointer', padding: 0, fontSize: '0.78rem', fontWeight: 500 }}
            >
              Our Packages
            </button>
          ) : (
            <span>Our Packages</span>
          )}
          <span>·</span>
          <span style={{ color: 'var(--gs-forest)', fontWeight: 600 }}>{packageData.title}</span>
        </div>

        {onBackToCatalogue && (
          <button onClick={onBackToCatalogue} className="gs-btn gs-btn-ghost gs-btn-sm" style={{ borderColor: 'var(--gs-sand-dark)', color: 'var(--gs-forest)' }}>
            ← All 8 Packages
          </button>
        )}
      </div>

      {/* ── Large Header Title (The Seasons Style from Image 5) ────────── */}
      <h1 className="gs-explore-header-title">
        {packageData.durationDays} Day {packageData.title} in {packageData.tags.regions[0] || 'Tanzania'}
      </h1>

      {/* ── Bento Media Gallery Grid (Image 5) ─────────────────────────── */}
      <div className="gs-bento-gallery-grid">
        {/* Main Large Visual / Video */}
        <div className="gs-bento-main-col">
          <img
            src={packageData.heroImage}
            alt={packageData.title}
            className="gs-bento-main-img"
          />
          <button
            onClick={() => setShowVideoModal(true)}
            className="gs-bento-video-overlay-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Safari Film
          </button>
        </div>

        {/* 3 Sub-images on Right Column */}
        <div className="gs-bento-side-col">
          <div className="gs-bento-side-top">
            <img
              src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
              alt="Tanzania Savannah Landscape"
              className="gs-bento-sub-img"
            />
          </div>
          <div className="gs-bento-side-bottom-grid">
            <img
              src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80"
              alt="African Wildlife Safari"
              className="gs-bento-sub-img"
            />
            <img
              src="https://images.unsplash.com/photo-1527576539890-dfa815648363?auto=format&fit=crop&w=600&q=80"
              alt="Luxury Safari Tented Camp"
              className="gs-bento-sub-img"
            />
          </div>
        </div>
      </div>

      {/* ── Secondary In-Page Sub-Navbar Ribbon (Under Gallery & Floating Sticky) ── */}
      <div className={`gs-subnav-sticky-wrapper${isSubnavSticky ? ' is-floating' : ''}`}>
        <nav className="gs-subnav-ribbon">
          <a href="#about" className={`gs-subnav-link${activeSection === 'about' ? ' active' : ''}`}>About Safari</a>
          <a href="#inclusions" className={`gs-subnav-link${activeSection === 'inclusions' ? ' active' : ''}`}>What's Included</a>
          <a href="#special" className={`gs-subnav-link${activeSection === 'special' ? ' active' : ''}`}>The Promise</a>
          <a href="#program" className={`gs-subnav-link${activeSection === 'program' ? ' active' : ''}`}>Full Program</a>
          <a href="#cuisine" className={`gs-subnav-link${activeSection === 'cuisine' ? ' active' : ''}`}>Safari Cuisine</a>
          <a href="#stays" className={`gs-subnav-link${activeSection === 'stays' ? ' active' : ''}`}>Accommodations</a>
          <a href="#route" className={`gs-subnav-link${activeSection === 'route' ? ' active' : ''}`}>Circuit Trail</a>
          <a href="#addons" className={`gs-subnav-link${activeSection === 'addons' ? ' active' : ''}`}>Signature Add-ons</a>
        </nav>
      </div>

      {/* ── 2-Column Split Body Layout (Images 1–4) ────────────────────── */}
      <div className="gs-explore-2col-layout">
        {/* Left Column: Full In-Depth Content */}
        <div className="gs-explore-main-content">
          {/* 1. About Safari Section (Image 4) */}
          <section className="gs-explore-section-block" id="about">
            <h2 className="gs-explore-section-title">About Safari</h2>
            <p className="gs-explore-lead-paragraph">{packageData.openingCopy}</p>
          </section>

          {/* 2. What's Included in This Package (Images 3 & 4 Style) */}
          <section className="gs-explore-section-block" id="inclusions">
            <h2 className="gs-explore-section-title">What's Included In This Package</h2>
            <div className="gs-inclusions-checklist-grid">
              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Luxury Accommodations</span>
                  <span className="gs-inclusion-detail">{packageData.durationNights} Nights handpicked luxury safari lodges &amp; authentic tented camps</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Full Board Dining</span>
                  <span className="gs-inclusion-detail">3 daily chef-prepared organic meals with international gourmet standards</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Bush Refreshments</span>
                  <span className="gs-inclusion-detail">Chilled bottled water, artisan Tanzanian coffee, tea &amp; sundowner snacks</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="18" y2="10" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Private 4x4 Land Cruiser</span>
                  <span className="gs-inclusion-detail">Pop-up game-viewing roof, window seat guarantee, inverter charging &amp; optics</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">All Park &amp; Crater Fees</span>
                  <span className="gs-inclusion-detail">100% of TANAPA national park entry fees, conservation permits &amp; transit dues</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Professional Naturalist Guide</span>
                  <span className="gs-inclusion-detail">Dedicated certified English-speaking safari guide with deep wildlife tracking lore</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Emergency Medical Evacuation</span>
                  <span className="gs-inclusion-detail">Flying Doctors AMREF airborne airlift coverage for complete peace of mind</span>
                </div>
              </div>

              <div className="gs-inclusion-luxury-card">
                <div className="gs-inclusion-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                </div>
                <div className="gs-inclusion-content">
                  <span className="gs-inclusion-title">Onboard Vehicle &amp; Lodge Wi-Fi</span>
                  <span className="gs-inclusion-detail">Stay effortlessly connected to share journey moments across your adventure</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. What Makes This Safari Special (Images 3 Style) */}
          <section className="gs-explore-section-block" id="special">
            <h2 className="gs-explore-section-title">What Makes This Safari Special</h2>
            
            {/* The Promise Callout Banner */}
            <div className="gs-special-promise-card">
              <span className="gs-special-promise-tag">THE GRAFTON PROMISE</span>
              <p className="gs-special-promise-quote">
                "{packageData.thePromise}"
              </p>
            </div>

            {/* Signature Highlights Grid */}
            <div className="gs-special-highlights-grid">
              {packageData.highlights.map((highlight, idx) => (
                <div key={idx} className="gs-special-highlight-item">
                  <div className="gs-special-number-badge">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="gs-special-highlight-text">
                    <p>{highlight}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Full Program & Sample Daily Schedule (Images 2 & 3 Style) */}
          <section className="gs-explore-section-block" id="program">
            <h2 className="gs-explore-section-title">Full Program &amp; Daily Schedule</h2>
            
            {/* Logistics Tri-Pills */}
            <div className="gs-program-logistics-bar">
              <div className="gs-program-logistics-pill">
                <div className="gs-program-pill-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <span className="gs-program-pill-label">START / FINISH</span>
                  <span className="gs-program-pill-val">{packageData.startEnd}</span>
                </div>
              </div>

              <div className="gs-program-logistics-pill">
                <div className="gs-program-pill-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                </div>
                <div>
                  <span className="gs-program-pill-label">JOURNEY PACE</span>
                  <span className="gs-program-pill-val">{packageData.tags.pace} Safari Pace</span>
                </div>
              </div>

              <div className="gs-program-logistics-pill">
                <div className="gs-program-pill-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="18" y2="10" />
                  </svg>
                </div>
                <div>
                  <span className="gs-program-pill-label">SAFARI VEHICLE</span>
                  <span className="gs-program-pill-val">Private 4x4 Land Cruiser</span>
                </div>
              </div>
            </div>

            {/* Sample Daily Safari Rhythm Flow (from Image 2) */}
            <div className="gs-daily-rhythm-container">
              <div className="gs-daily-rhythm-header">
                <span className="gs-special-promise-tag">DAILY RHYTHM</span>
                <h3 className="gs-daily-rhythm-title">Sample Daily Safari Flow</h3>
              </div>
              <div className="gs-daily-rhythm-grid">
                <div className="gs-rhythm-slot-card">
                  <div className="gs-rhythm-time-pill">06:30</div>
                  <h5 className="gs-rhythm-slot-name">Dawn Game Drive</h5>
                  <p className="gs-rhythm-slot-desc">Sunrise wildlife tracking when savannah predators are most active</p>
                </div>

                <div className="gs-rhythm-slot-card">
                  <div className="gs-rhythm-time-pill">09:00</div>
                  <h5 className="gs-rhythm-slot-name">Bush Breakfast</h5>
                  <p className="gs-rhythm-slot-desc">Freshly prepared hot breakfast served under shaded acacia trees</p>
                </div>

                <div className="gs-rhythm-slot-card">
                  <div className="gs-rhythm-time-pill">13:00</div>
                  <h5 className="gs-rhythm-slot-name">Lodge Lunch &amp; Rest</h5>
                  <p className="gs-rhythm-slot-desc">Plated three-course camp lunch &amp; relaxed poolside midday rest</p>
                </div>

                <div className="gs-rhythm-slot-card">
                  <div className="gs-rhythm-time-pill">16:00</div>
                  <h5 className="gs-rhythm-slot-name">Sunset Safari</h5>
                  <p className="gs-rhythm-slot-desc">Golden hour safari tracking followed by scenic kopje sundowner drinks</p>
                </div>

                <div className="gs-rhythm-slot-card">
                  <div className="gs-rhythm-time-pill">19:30</div>
                  <h5 className="gs-rhythm-slot-name">Campfire Dinner</h5>
                  <p className="gs-rhythm-slot-desc">Multi-course gourmet dinner &amp; stargazing around the open boma fire</p>
                </div>
              </div>
            </div>

            {/* Detailed Day-by-Day Timeline */}
            <DailyItineraryTimeline
              itinerary={packageData.itinerary}
              activeDay={activeMapDay}
              onDayClick={setActiveMapDay}
            />
          </section>

          {/* 5. Safari Cuisine & Bush Dining (Images 1 & 4 Style) */}
          <section className="gs-explore-section-block" id="cuisine">
            <h2 className="gs-explore-section-title">Safari Cuisine &amp; Bush Dining</h2>
            <p className="gs-explore-lead-paragraph">
              Every Grafton safari features farm-to-table culinary experiences crafted by private camp chefs. Fresh organic ingredients, tropical fruits, and local spices are paired with international gastronomic standards and scenic bush dining under the African sky.
            </p>

            <div className="gs-cuisine-features-grid">
              {/* Card 1: Meals Provided */}
              <div className="gs-cuisine-box">
                <div className="gs-cuisine-box-header">
                  <div className="gs-cuisine-header-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="2" x2="6" y2="4" />
                      <line x1="10" y1="2" x2="10" y2="4" />
                      <line x1="14" y1="2" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="gs-cuisine-box-title">Meals Provided</h4>
                    <p className="gs-cuisine-box-sub">Curated daily by private camp safari chefs</p>
                  </div>
                </div>

                <div className="gs-cuisine-checklist">
                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">01</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Hearty Cooked Safari Breakfasts</span>
                      <span className="gs-cuisine-item-desc">Fresh tropical fruits, made-to-order eggs &amp; hot bush coffee</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">02</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Three-Course Plated Camp Lunches &amp; Picnics</span>
                      <span className="gs-cuisine-item-desc">Scenic wilderness lunch hampers &amp; fresh dining at safari lodges</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">03</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Gourmet Multi-Course Campfire Dinners</span>
                      <span className="gs-cuisine-item-desc">Fine plated dining under the stars with open boma campfire ambience</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">04</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Sundowner Canapés &amp; Chilled Drinks</span>
                      <span className="gs-cuisine-item-desc">Artisanal sunset bites paired with premium wines, gin &amp; refreshments</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Diets Catered */}
              <div className="gs-cuisine-box">
                <div className="gs-cuisine-box-header">
                  <div className="gs-cuisine-header-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="gs-cuisine-box-title">Diets Catered</h4>
                    <p className="gs-cuisine-box-sub">Customized menus (please notify us in advance)</p>
                  </div>
                </div>

                <div className="gs-cuisine-checklist">
                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">✓</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Vegetarian &amp; Vegan Menus</span>
                      <span className="gs-cuisine-item-desc">Vibrant, nutrient-dense plant-forward culinary creations</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">✓</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Gluten-Free &amp; Celiac-Safe</span>
                      <span className="gs-cuisine-item-desc">Dedicated kitchen prep &amp; strict cross-contamination safety</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">✓</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Dairy-Free &amp; Nut-Free</span>
                      <span className="gs-cuisine-item-desc">Carefully isolated allergen management by private camp chefs</span>
                    </div>
                  </div>

                  <div className="gs-cuisine-item-card">
                    <div className="gs-cuisine-item-dot">✓</div>
                    <div className="gs-cuisine-item-text">
                      <span className="gs-cuisine-item-title">Halal &amp; Kosher-Friendly Options</span>
                      <span className="gs-cuisine-item-desc">Certified ingredient sourcing &amp; dedicated cooking ware on request</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Photo Food & Dining Strip (Image 1) */}
            <div className="gs-cuisine-photos-strip">
              <div className="gs-cuisine-photo-wrap">
                <img
                  src="https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80"
                  alt="Safari Bush Breakfast"
                  className="gs-cuisine-strip-img"
                />
                <span className="gs-cuisine-photo-caption">Sunrise Bush Breakfast</span>
              </div>

              <div className="gs-cuisine-photo-wrap">
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80"
                  alt="Fresh Organic Bush Lunch"
                  className="gs-cuisine-strip-img"
                />
                <span className="gs-cuisine-photo-caption">Farm-Fresh Lunch</span>
              </div>

              <div className="gs-cuisine-photo-wrap">
                <img
                  src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80"
                  alt="Campfire Grill Feast"
                  className="gs-cuisine-strip-img"
                />
                <span className="gs-cuisine-photo-caption">Campfire Grill Feast</span>
              </div>

              <div className="gs-cuisine-photo-wrap">
                <img
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80"
                  alt="Sunset Sundowner Cocktails"
                  className="gs-cuisine-strip-img"
                />
                <span className="gs-cuisine-photo-caption">Sundowner Cocktails</span>
              </div>
            </div>
          </section>

          {/* 6. Accommodations Selector (Images 1 & 4) */}
          <section className="gs-explore-section-block" id="stays">
            <AccommodationSelector
              packageData={packageData}
              selectedTier={accommodationTier}
              onSelectTier={setAccommodationTier}
            />
          </section>

          {/* 7. Interactive Route Map */}
          <section className="gs-explore-section-block" id="route">
            <h2 className="gs-explore-section-title">Geographic Circuit Map</h2>
            <InteractiveRouteMap
              packageData={packageData}
              activeDay={activeMapDay}
              onSelectDay={setActiveMapDay}
            />
          </section>

          {/* 8. Signature Add-ons */}
          <section className="gs-explore-section-block" id="addons">
            <AddonSelector
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={handleToggleAddon}
              adultsCount={adults}
            />
          </section>
        </div>

        {/* Right Column: Sticky Sidebar with Real-Time Customizer */}
        <aside className="gs-explore-sticky-sidebar">
          {/* Live Calculated Price Header */}
          <div className="gs-sidebar-pricing-block">
            <span className="gs-sidebar-price-label">from</span>
            <span className="gs-sidebar-price-amount">
              ${(calculation.indicativePricePerPerson || packageData.basePriceComfort).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', display: 'block', marginTop: '2px' }}>
              per person sharing · {accommodationTier} Tier
            </span>
          </div>

          {/* Key Circuit Metadata */}
          <div className="gs-sidebar-meta-list">
            <div className="gs-sidebar-meta-row">
              <svg className="gs-sidebar-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span>{packageData.route.slice(0, 3).join(', ')}, Tanzania</span>
            </div>

            <div className="gs-sidebar-meta-row">
              <svg className="gs-sidebar-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="18" y2="10" />
              </svg>
              <span>{packageData.bestMonths.slice(0, 2).join(', ')} ({packageData.durationDays} days, {packageData.durationNights} nights)</span>
            </div>

            <div className="gs-sidebar-meta-row">
              <svg className="gs-sidebar-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{adults} Adults{children > 0 ? `, ${children} Children` : ''} · Private 4x4</span>
            </div>
          </div>

          {/* ── Real-Time Customize Dates & Party Composition ── */}
          <div className="gs-sidebar-customizer-section">
            <div className="gs-sidebar-section-title">
              <span>Customize Dates &amp; Party</span>
            </div>

            {packageData.isFixedDeparture ? (
              <FixedDepartureCalendar
                selectedDepartureId={selectedDepartureId}
                onSelect={(dep) => {
                  setSelectedDepartureId(dep ? dep.id : null);
                  if (dep) setTravelDate(dep.departure_date);
                }}
                singleSupplement={singleSupplementP8}
                onToggleSupplement={setSingleSupplementP8}
                adults={adults}
                children={children}
              />
            ) : (
              <>
                {/* Preferred Travel Month / Date */}
                <div className="gs-sidebar-field-box">
                  <label className="gs-sidebar-label">Preferred Travel Month / Date</label>
                  <select
                    className="gs-select"
                    value={travelMonth}
                    onChange={(e) => setTravelMonth(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                  >
                    {packageData.bestMonths.map((m) => (
                      <option key={m} value={m.split(' ')[0]}>{m}</option>
                    ))}
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>

                  <input
                    type="date"
                    className="gs-input"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Exact departure date"
                    style={{ padding: '8px 12px', fontSize: '0.82rem', marginTop: '4px' }}
                  />
                  <span className="gs-hint" style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                    Current Season: <strong>{calculation.seasonLabel}</strong>
                  </span>
                </div>

                {/* Adults, Children, Single Rooms Steppers */}
                <div className="gs-sidebar-stepper-grid">
                  <div className="gs-sidebar-stepper-row">
                    <span className="gs-sidebar-stepper-label">Adults (12+)</span>
                    <div className="gs-stepper">
                      <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))}>-</button>
                      <strong>{adults}</strong>
                      <button type="button" onClick={() => setAdults(adults + 1)}>+</button>
                    </div>
                  </div>

                  <div className="gs-sidebar-stepper-row">
                    <span className="gs-sidebar-stepper-label">Children (&lt;12)</span>
                    <div className="gs-stepper">
                      <button type="button" onClick={() => setChildren(Math.max(0, children - 1))}>-</button>
                      <strong>{children}</strong>
                      <button type="button" onClick={() => setChildren(children + 1)}>+</button>
                    </div>
                  </div>

                  <div className="gs-sidebar-stepper-row">
                    <span className="gs-sidebar-stepper-label">Single Rooms</span>
                    <div className="gs-stepper">
                      <button type="button" onClick={() => setSingleRooms(Math.max(0, singleRooms - 1))}>-</button>
                      <strong>{singleRooms}</strong>
                      <button type="button" onClick={() => setSingleRooms(singleRooms + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Bedding / Room Layout Summary */}
                <div className="gs-sidebar-rooms-box">
                  <span className="gs-sidebar-rooms-title">Bedding &amp; Room Layout:</span>
                  <div className="gs-sidebar-rooms-desc">
                    Double Beds: <strong>{Math.max(0, Math.floor((adults - singleRooms) / 2))}</strong> · Single Beds: <strong>{singleRooms}</strong>
                    {children > 0 ? ` · Family Suite required` : ''}
                  </div>
                </div>

                {adults + children >= 4 && (
                  <div className="gs-savings-banner" style={{ fontSize: '0.76rem', padding: '8px 10px' }}>
                    <strong>Vehicle Advantage:</strong> Save ${calculation.breakdown.vehicleCostSavingPerPerson * (adults + children)} with 4+ guests sharing.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Primary CTA Button */}
          <button
            onClick={() => setShowQuoteModal(true)}
            className="gs-sidebar-cta-btn"
          >
            Get in touch ➔
          </button>

          {/* Quick Utility Tools: Save Draft, Share, Print PDF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '-10px' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="gs-btn gs-btn-ghost gs-btn-sm"
              style={{ fontSize: '0.72rem', padding: '6px 4px', borderColor: 'var(--gs-sand-dark)', color: 'var(--gs-forest)' }}
              title="Save anonymous draft for 30 days"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleShareLink}
              className="gs-btn gs-btn-ghost gs-btn-sm"
              style={{ fontSize: '0.72rem', padding: '6px 4px', borderColor: 'var(--gs-sand-dark)', color: 'var(--gs-forest)' }}
              title="Copy link to clipboard"
            >
              Share Link
            </button>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="gs-btn gs-btn-ghost gs-btn-sm"
              style={{ fontSize: '0.72rem', padding: '6px 4px', borderColor: 'var(--gs-sand-dark)', color: 'var(--gs-forest)' }}
              title="Print / PDF View"
            >
              Print / PDF
            </button>
          </div>
        </aside>
      </div>

      {/* ── Fullscreen Video Showcase Lightbox ───────────────────────────── */}
      {showVideoModal && (
        <div className="gs-video-lightbox" onClick={() => setShowVideoModal(false)}>
          <div className="gs-video-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-close-btn" onClick={() => setShowVideoModal(false)}>✕</button>
            <video autoPlay controls playsInline className="lightbox-video-player">
              <source src={packageData.heroVideo} type="video/mp4" />
            </video>
            <div className="lightbox-video-footer">
              <h3>{packageData.title}</h3>
              <p>{packageData.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable / Downloadable Itinerary Proposal Modal ───────────── */}
      {showPrintModal && (
        <div className="gs-modal-backdrop" onClick={() => setShowPrintModal(false)}>
          <div
            className="gs-modal-compare-container"
            style={{ maxWidth: '800px', background: 'var(--gs-white)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gs-modal-header">
              <div>
                <span className="gs-badge-gold">Formatted Itinerary Summary</span>
                <h2>{packageData.title} — Proposal Document</h2>
                <p>Print or save as PDF for your records.</p>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="gs-modal-close-btn">✕</button>
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--gs-sand-dark)', borderBottom: '1px solid var(--gs-sand-dark)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Duration:</strong> {packageData.durationDays} Days / {packageData.durationNights} Nights</div>
                <div><strong>Season:</strong> {calculation.seasonLabel}</div>
                <div><strong>Party:</strong> {adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ''}</div>
                <div><strong>Tier:</strong> {accommodationTier} Accommodation</div>
                <div><strong>Circuit:</strong> {packageData.routeString}</div>
                <div>
                  <strong>Indicative Price:</strong>{' '}
                  <span style={{ color: 'var(--gs-gold-dark)', fontWeight: 'bold' }}>
                    {calculation.isReserveTier ? 'Price to be reviewed' : `$${calculation.indicativePricePerPerson?.toLocaleString()} pp`}
                  </span>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Day-by-Day Route & Activities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {packageData.itinerary.map((day) => (
                <div key={day.day} style={{ background: 'var(--gs-sand)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  <strong>Day {day.day}: {day.title}</strong> — <em>{day.activity}</em>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)', marginTop: '2px' }}>
                    Route: {day.startLocation} ➔ {day.destination} ({day.travelTime}) | Stay: {day.accommodationBrief}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                className="gs-btn gs-btn-gold"
              >
                🖨 Print / Save as PDF
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="gs-btn gs-btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Final Quotation Modal ────────────────────────────────── */}
      {showQuoteModal && (
        <div className="gs-modal-backdrop" onClick={() => setShowQuoteModal(false)}>
          <div className="gs-modal-quote-container" onClick={(e) => e.stopPropagation()}>
            <div className="gs-modal-header">
              <div>
                <span className="gs-badge-gold">Bespoke Proposal</span>
                <h2>Request Final Quotation</h2>
                <p>We’ll review availability, lock in your preferred season, and email you a tailored proposal.</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="gs-modal-close-btn">✕</button>
            </div>

            <form className="gs-quote-form" onSubmit={handleSubmitQuotation}>
              <div className="gs-form-row cols-2">
                <div className="gs-field">
                  <label className="gs-label required">Full Name</label>
                  <input
                    type="text"
                    className="gs-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="gs-field">
                  <label className="gs-label required">Email Address</label>
                  <input
                    type="email"
                    className="gs-input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>
              </div>

              <div className="gs-field">
                <label className="gs-label required">Phone Number (with country code)</label>
                <input
                  type="tel"
                  className="gs-input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  required
                />
              </div>

              <div className="gs-field">
                <label className="gs-label">Special Requests / Notes</label>
                <textarea
                  className="gs-textarea"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Dietary requirements, celebrations, photography interests…"
                  rows={3}
                />
              </div>

              {quoteError && (
                <div className="gs-alert gs-alert-error">
                  <span>⚠</span> <span>{quoteError}</span>
                </div>
              )}

              <div className="gs-quote-modal-summary">
                <span>Indicative Total:</span>
                <strong>
                  {calculation.isReserveTier ? 'Price to be reviewed' : `$${calculation.indicativeTotalPrice?.toLocaleString()}`}
                </strong>
              </div>

              <button
                type="submit"
                className="gs-btn gs-btn-gold gs-btn-full gs-btn-lg gs-glow-btn"
                disabled={submittingQuote}
              >
                {submittingQuote ? (
                  <>
                    <span className="gs-spinner" /> Submitting to Grafton Team…
                  </>
                ) : (
                  'Submit Itinerary for Final Quotation ➔'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
