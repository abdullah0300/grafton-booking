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
  initialAdults?: number;
  initialChildren?: number;
  initialSingleRooms?: number;
  initialTravelDate?: string;
  initialTravelMonth?: string;
  initialTier?: 'Comfort' | 'Signature' | 'Reserve';
  initialAddonIds?: string[];
  autoOpenPlanModal?: boolean;
}

export default function ItineraryBuilder({
  packageData,
  onBackToCatalogue,
  initialLeadId,
  initialFilters,
  initialAdults,
  initialChildren,
  initialSingleRooms,
  initialTravelDate,
  initialTravelMonth,
  initialTier,
  initialAddonIds,
  autoOpenPlanModal,
}: ItineraryBuilderProps) {
  // Builder Configuration State — pre-populated from Discovery Filter Drawer or Proposal/Draft
  const [adults, setAdults] = useState<number>(initialAdults ?? initialFilters?.adults ?? 2);
  const [children, setChildren] = useState<number>(initialChildren ?? initialFilters?.children ?? 0);
  const [singleRooms, setSingleRooms] = useState<number>(initialSingleRooms ?? 0);
  const [travelDate, setTravelDate] = useState<string>(initialTravelDate || initialFilters?.startDate || '');
  const [travelMonth, setTravelMonth] = useState<string>(
    initialTravelMonth || initialFilters?.travelMonth || packageData.bestMonths[0]?.split(' ')[0] || 'August'
  );
  const [accommodationTier, setAccommodationTier] = useState<'Comfort' | 'Signature' | 'Reserve'>(
    initialTier || (initialFilters?.comfortLevels?.[0] as any) || 'Comfort'
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(initialAddonIds || []);
  const [activeMapDay, setActiveMapDay] = useState<number>(1);

  // Package 8 specific state
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);
  const [singleSupplementP8, setSingleSupplementP8] = useState<boolean>(Boolean(initialSingleRooms && initialSingleRooms > 0));

  // Modals & UI States
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [draftToast, setDraftToast] = useState<string | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Collapsible accordion state for the left column
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    about: true,
    inclusions: true,
    special: true,
    program: true,
    cuisine: true,
    stays: true,
    route: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubnavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: true,
    }));
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dedicated "Let's Plan" Customization Modal State
  const [showPlanModal, setShowPlanModal] = useState<boolean>(Boolean(autoOpenPlanModal));

  useEffect(() => {
    if (autoOpenPlanModal) {
      setShowPlanModal(true);
    }
  }, [autoOpenPlanModal]);

  useEffect(() => {
    if (initialAddonIds && initialAddonIds.length > 0) {
      setSelectedAddonIds(initialAddonIds);
    }
    if (typeof initialSingleRooms === 'number') {
      setSingleRooms(initialSingleRooms);
      setSingleSupplementP8(initialSingleRooms > 0);
    }
    if (typeof initialAdults === 'number') {
      setAdults(initialAdults);
    }
    if (typeof initialChildren === 'number') {
      setChildren(initialChildren);
    }
    if (initialTier) {
      setAccommodationTier(initialTier);
    }
    if (initialTravelDate) {
      setTravelDate(initialTravelDate);
    }
    if (initialTravelMonth) {
      setTravelMonth(initialTravelMonth);
    }
  }, [
    initialAddonIds,
    initialSingleRooms,
    initialAdults,
    initialChildren,
    initialTier,
    initialTravelDate,
    initialTravelMonth,
  ]);

  // Prevent background page scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showPlanModal || showQuoteModal || showVideoModal;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showPlanModal, showQuoteModal, showVideoModal]);

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
      <ConfirmationCard
        bookingReference={confirmedBookingRef}
        guestName={contactName}
        packageTitle={packageData.title}
        departureDate={travelDate || undefined}
        onClose={() => setConfirmedBookingRef(null)}
      />
    );
  }

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
          <a href="#about" onClick={(e) => handleSubnavClick(e, 'about')} className={`gs-subnav-link${activeSection === 'about' ? ' active' : ''}`}>
            📖 About
          </a>
          <a href="#inclusions" onClick={(e) => handleSubnavClick(e, 'inclusions')} className={`gs-subnav-link${activeSection === 'inclusions' ? ' active' : ''}`}>
            ✨ Inclusions
          </a>
          <a href="#special" onClick={(e) => handleSubnavClick(e, 'special')} className={`gs-subnav-link${activeSection === 'special' ? ' active' : ''}`}>
            🏆 The Promise
          </a>
          <a href="#program" onClick={(e) => handleSubnavClick(e, 'program')} className={`gs-subnav-link${activeSection === 'program' ? ' active' : ''}`}>
            🧭 Daily Schedule
          </a>
          <a href="#cuisine" onClick={(e) => handleSubnavClick(e, 'cuisine')} className={`gs-subnav-link${activeSection === 'cuisine' ? ' active' : ''}`}>
            🍽️ Safari Cuisine
          </a>
          <a href="#stays" onClick={(e) => handleSubnavClick(e, 'stays')} className={`gs-subnav-link${activeSection === 'stays' ? ' active' : ''}`}>
            🏕️ Accommodations
          </a>
          <a href="#route" onClick={(e) => handleSubnavClick(e, 'route')} className={`gs-subnav-link${activeSection === 'route' ? ' active' : ''}`}>
            🗺️ Circuit Map
          </a>
        </nav>
      </div>

      {/* ── 2-Column Split Body Layout (Collapsibles on Left + Clean Sticky on Right) ── */}
      <div className="gs-explore-2col-layout">
        {/* Left Column: Clean Collapsible Accordion Sections */}
        <div className="gs-explore-main-content" style={{ gap: '20px' }}>
          
          {/* 1. About Safari (Collapsible) */}
          <div className="gs-accordion-block" id="about">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('about')}
              aria-expanded={openSections.about}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">📖</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">About This Safari</h3>
                  <p className="gs-accordion-sub">Overview, expedition style, and wildlife highlights</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.about ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.about && (
              <div className="gs-accordion-body">
                <p className="gs-explore-lead-paragraph" style={{ margin: 0 }}>
                  {packageData.openingCopy}
                </p>
              </div>
            )}
          </div>

          {/* 2. What's Included (Collapsible) */}
          <div className="gs-accordion-block" id="inclusions">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('inclusions')}
              aria-expanded={openSections.inclusions}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">✨</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">What's Included In This Package</h3>
                  <p className="gs-accordion-sub">8 comprehensive inclusions &amp; seamless private logistical coverage</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.inclusions ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.inclusions && (
              <div className="gs-accordion-body">
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
                      <span className="gs-inclusion-title">Flying Doctors Evacuation Cover</span>
                      <span className="gs-inclusion-detail">AMREF Flying Doctors 24/7 air ambulance emergency medical evacuation included</span>
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
                      <span className="gs-inclusion-title">Onboard Vehicle Wi-Fi</span>
                      <span className="gs-inclusion-detail">High-speed satellite connectivity throughout safari transit routes &amp; lodges</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. The Promise & Highlights (Collapsible) */}
          <div className="gs-accordion-block" id="special">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('special')}
              aria-expanded={openSections.special}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">🏆</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">The Grafton Promise &amp; Highlights</h3>
                  <p className="gs-accordion-sub">Signature moments, unhurried pacing &amp; conservation excellence</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.special ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.special && (
              <div className="gs-accordion-body">
                {/* The Promise Callout Banner */}
                <div className="gs-special-promise-card" style={{ marginBottom: '20px' }}>
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
              </div>
            )}
          </div>

          {/* 4. Full Program & Daily Schedule (Collapsible) */}
          <div className="gs-accordion-block" id="program">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('program')}
              aria-expanded={openSections.program}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">🧭</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">Full Program &amp; Daily Schedule</h3>
                  <p className="gs-accordion-sub">{packageData.durationDays} Days / {packageData.durationNights} Nights milestone journey &amp; daily rhythm</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.program ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.program && (
              <div className="gs-accordion-body">
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

                {/* Horizontal Day Navigator & Spotlight */}
                <DailyItineraryTimeline
                  itinerary={packageData.itinerary}
                  activeDay={activeMapDay}
                  onDayClick={setActiveMapDay}
                />

                {/* Sample Daily Safari Rhythm Flow */}
                <div className="gs-daily-rhythm-container" style={{ marginTop: '24px' }}>
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
              </div>
            )}
          </div>

          {/* 5. Safari Cuisine & Bush Dining (Collapsible) */}
          <div className="gs-accordion-block" id="cuisine">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('cuisine')}
              aria-expanded={openSections.cuisine}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">🍽️</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">Safari Cuisine &amp; Bush Dining</h3>
                  <p className="gs-accordion-sub">Farm-to-table culinary experiences crafted by private camp chefs</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.cuisine ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.cuisine && (
              <div className="gs-accordion-body">
                <p className="gs-explore-lead-paragraph" style={{ marginBottom: '18px' }}>
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

                {/* 4-Photo Food Strip */}
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
              </div>
            )}
          </div>

          {/* 6. Accommodations Showcase (Collapsible) */}
          <div className="gs-accordion-block" id="stays">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('stays')}
              aria-expanded={openSections.stays}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">🏕️</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">Curated Accommodations Showcase</h3>
                  <p className="gs-accordion-sub">Handpicked luxury safari lodges &amp; tented wilderness camps</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.stays ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.stays && (
              <div className="gs-accordion-body">
                <AccommodationSelector
                  packageData={packageData}
                  selectedTier={accommodationTier}
                  onSelectTier={setAccommodationTier}
                />
              </div>
            )}
          </div>

          {/* 7. Geographic Circuit Map (Collapsible) */}
          <div className="gs-accordion-block" id="route">
            <button
              type="button"
              className="gs-accordion-header"
              onClick={() => toggleSection('route')}
              aria-expanded={openSections.route}
            >
              <div className="gs-accordion-title-wrap">
                <div className="gs-accordion-icon-badge">🗺️</div>
                <div className="gs-accordion-titles">
                  <h3 className="gs-accordion-title">Geographic Circuit Trail</h3>
                  <p className="gs-accordion-sub">Interactive route mapping across Tanzania's legendary national parks</p>
                </div>
              </div>
              <div className={`gs-accordion-chevron${openSections.route ? ' is-open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {openSections.route && (
              <div className="gs-accordion-body">
                <InteractiveRouteMap
                  packageData={packageData}
                  activeDay={activeMapDay}
                  onSelectDay={setActiveMapDay}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Ultra-Clean Starting Price Card with "Let's Plan" CTA ── */}
        <aside className="gs-explore-sticky-sidebar">
          {/* Base Starting Price Header */}
          <div className="gs-sidebar-pricing-block">
            <span className="gs-sidebar-price-label">Starting from</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0 2px' }}>
              <span className="gs-sidebar-price-amount" style={{ marginLeft: 0 }}>
                ${(calculation.indicativePricePerPerson || packageData.basePriceComfort).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>/ person</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', display: 'block' }}>
              Based on 2 guests sharing · {accommodationTier} Tier · {packageData.durationDays}D / {packageData.durationNights}N
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
              <span>Best Season: {packageData.bestMonths.slice(0, 2).join(', ')}</span>
            </div>

            <div className="gs-sidebar-meta-row">
              <svg className="gs-sidebar-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{adults} Guests · Private 4x4 Land Cruiser</span>
            </div>
          </div>

          {/* Active Selections Summary Pill Bar (If Customized via Modal) */}
          {(adults !== 2 || children > 0 || singleRooms > 0 || accommodationTier !== 'Comfort' || selectedAddonIds.length > 0) && (
            <div className="gs-sidebar-active-selections">
              <span className="gs-sidebar-selection-label">CUSTOM SELECTIONS</span>
              <div className="gs-sidebar-selection-pills">
                <span className="gs-sidebar-pill-tag">👥 {adults} Adults{children > 0 ? `, ${children} Ch` : ''}</span>
                <span className="gs-sidebar-pill-tag">🏨 {accommodationTier} Tier</span>
                {selectedAddonIds.length > 0 && (
                  <span className="gs-sidebar-pill-tag">✨ {selectedAddonIds.length} Add-on{selectedAddonIds.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          )}

          {/* Prominent "Let's Plan" Master Button */}
          <button
            onClick={() => setShowPlanModal(true)}
            className="gs-sidebar-cta-btn"
            style={{
              background: 'linear-gradient(135deg, #142820 0%, #1F3D32 100%)',
              fontSize: '1rem',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 6px 20px rgba(20, 40, 32, 0.25)',
            }}
          >
            <span>Let's Plan This Safari</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          {/* Quick Utilities: Save Draft, Share, Print PDF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '-6px' }}>
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

      {/* ── "Let's Plan" Interactive Customization Modal (Ultra-Luxurious & Breathable) ── */}
      {showPlanModal && (
        <div className="gs-plan-modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="gs-plan-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="gs-plan-modal-header">
              <div>
                <h2 className="gs-plan-modal-title">Customize Your Safari</h2>
                <p className="gs-plan-modal-sub">
                  Tailor departure timing, party size, accommodation standard, and optional experiences.
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="gs-plan-modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="gs-plan-modal-body">
              {/* Section 1: Travel Dates & Party Composition */}
              <div className="gs-plan-grid-2col">
                {/* 1A: Preferred Timing & Month Selector */}
                <div className="gs-plan-section-card">
                  <div className="gs-plan-section-header">
                    <h4 className="gs-plan-step-title">Travel Dates &amp; Season</h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Clean 12-Month Grid Selector */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="gs-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                          Preferred Month
                        </label>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gs-olive)', fontWeight: 500 }}>
                          Selected: {travelMonth} ({calculation.seasonLabel})
                        </span>
                      </div>
                      
                      <div className="gs-month-grid">
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((m) => {
                          const isSelected = travelMonth.toLowerCase() === m.toLowerCase();
                          const isRecommended = packageData.bestMonths.some((bm) =>
                            bm.toLowerCase().includes(m.toLowerCase()) || bm.includes('All Year')
                          );
                          return (
                            <button
                              key={m}
                              type="button"
                              className={`gs-month-pill${isSelected ? ' is-active' : ''}${isRecommended ? ' is-recommended' : ''}`}
                              onClick={() => {
                                setTravelMonth(m);
                                const now = new Date();
                                const currentYear = now.getFullYear();
                                const currentMonthIndex = now.getMonth();
                                const monthsList = [
                                  'January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'
                                ];
                                const monthIndex = monthsList.findIndex((item) => item.toLowerCase() === m.toLowerCase());
                                if (monthIndex !== -1) {
                                  const targetYear = monthIndex < currentMonthIndex ? currentYear + 1 : currentYear;
                                  const monthStr = String(monthIndex + 1).padStart(2, '0');
                                  setTravelDate(`${targetYear}-${monthStr}-01`);
                                }
                              }}
                              title={isRecommended ? `${m} (Prime season)` : m}
                            >
                              <span className="gs-month-pill-name">{m.slice(0, 3)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exact Departure Date Field */}
                    <div className="gs-date-picker-wrap">
                      <label className="gs-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                        Specific Departure Date (Optional)
                      </label>
                      <div className="gs-date-input-luxury">
                        <input
                          type="date"
                          value={travelDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTravelDate(val);
                            if (val) {
                              const d = new Date(val);
                              if (!isNaN(d.getTime())) {
                                const monthsList = [
                                  'January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'
                                ];
                                setTravelMonth(monthsList[d.getMonth()]);
                              }
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {travelDate && (
                          <button
                            type="button"
                            onClick={() => setTravelDate('')}
                            style={{ background: 'none', border: 'none', color: 'var(--gs-text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: '0 4px' }}
                            title="Clear date"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1B: Guests & Bedding */}
                <div className="gs-plan-section-card">
                  <div className="gs-plan-section-header">
                    <h4 className="gs-plan-step-title">Travelers &amp; Rooms</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="gs-plan-stepper-box">
                      <div className="gs-plan-stepper-label">
                        <span className="gs-plan-stepper-name">Adults (12+)</span>
                      </div>
                      <div className="gs-stepper">
                        <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                        <strong>{adults}</strong>
                        <button type="button" onClick={() => setAdults(adults + 1)}>+</button>
                      </div>
                    </div>

                    <div className="gs-plan-stepper-box">
                      <div className="gs-plan-stepper-label">
                        <span className="gs-plan-stepper-name">Children (&lt;12)</span>
                      </div>
                      <div className="gs-stepper">
                        <button type="button" onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                        <strong>{children}</strong>
                        <button type="button" onClick={() => setChildren(children + 1)}>+</button>
                      </div>
                    </div>

                    <div className="gs-plan-stepper-box">
                      <div className="gs-plan-stepper-label">
                        <span className="gs-plan-stepper-name">Single Rooms</span>
                      </div>
                      <div className="gs-stepper">
                        <button type="button" onClick={() => setSingleRooms(Math.max(0, singleRooms - 1))}>−</button>
                        <strong>{singleRooms}</strong>
                        <button type="button" onClick={() => setSingleRooms(singleRooms + 1)}>+</button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', paddingTop: '2px' }}>
                      Arrangement: <strong>{Math.max(0, Math.floor((adults - singleRooms) / 2))} Double / Twin</strong>
                      {singleRooms > 0 ? ` · ${singleRooms} Single` : ''}
                      {children > 0 ? ' · Family Suite' : ''}
                    </div>

                    {adults + children >= 4 && (
                      <div className="gs-savings-banner" style={{ margin: 0, padding: '8px 12px', fontSize: '0.76rem' }}>
                        Group rate applied for {adults + children} travelers sharing vehicle.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Accommodation Tier Standards */}
              <div className="gs-plan-section-card">
                <div className="gs-plan-section-header">
                  <h4 className="gs-plan-step-title">Accommodation Standard</h4>
                </div>

                <div className="gs-plan-tier-grid">
                  <div
                    className={`gs-plan-tier-card${accommodationTier === 'Comfort' ? ' is-selected' : ''}`}
                    onClick={() => setAccommodationTier('Comfort')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 className="gs-plan-tier-name">Comfort</h5>
                      <span className="gs-plan-tier-price">Standard</span>
                    </div>
                    <p className="gs-plan-tier-desc">{packageData.accommodation.comfortBrief}</p>
                  </div>

                  <div
                    className={`gs-plan-tier-card${accommodationTier === 'Signature' ? ' is-selected' : ''}`}
                    onClick={() => setAccommodationTier('Signature')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 className="gs-plan-tier-name">Signature</h5>
                      <span className="gs-plan-tier-price">
                        {packageData.basePriceSignature
                          ? `+$${(packageData.basePriceSignature - packageData.basePriceComfort).toLocaleString()} pp`
                          : 'Upgraded'}
                      </span>
                    </div>
                    <p className="gs-plan-tier-desc">{packageData.accommodation.signatureBrief}</p>
                  </div>

                  <div
                    className={`gs-plan-tier-card${accommodationTier === 'Reserve' ? ' is-selected' : ''}`}
                    onClick={() => setAccommodationTier('Reserve')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 className="gs-plan-tier-name">Reserve</h5>
                      <span className="gs-plan-tier-price">On Request</span>
                    </div>
                    <p className="gs-plan-tier-desc">{packageData.accommodation.reserveBrief}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Optional Wilderness Experiences */}
              <div className="gs-plan-section-card">
                <div className="gs-plan-section-header">
                  <h4 className="gs-plan-step-title">Optional Experiences</h4>
                </div>

                <div className="gs-plan-addon-grid">
                  {GLOBAL_ADDONS.map((addon) => {
                    const isSelected = selectedAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className={`gs-plan-addon-card${isSelected ? ' is-selected' : ''}`}
                        onClick={() => handleToggleAddon(addon.id)}
                      >
                        <div className="gs-plan-addon-checkbox-wrap">
                          {isSelected && '✓'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gs-forest)' }}>{addon.name}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gs-olive)' }}>
                              +${addon.pricePerPerson} pp
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {addon.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer with Live Recalculated Price & Action Buttons */}
            <div className="gs-plan-modal-footer">
              <div className="gs-plan-footer-price">
                <span className="gs-plan-footer-sub">Indicative Investment ({adults} {adults === 1 ? 'Adult' : 'Adults'}):</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="gs-plan-footer-total">
                    ${(calculation.indicativePricePerPerson || packageData.basePriceComfort).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gs-text-muted)' }}>per person sharing</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gs-olive)', marginLeft: '6px' }}>
                    (Total: ${(calculation.indicativeTotalPrice || packageData.basePriceComfort * adults).toLocaleString()})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="gs-btn gs-btn-ghost"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                >
                  Save &amp; Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false);
                    setShowQuoteModal(true);
                  }}
                  className="gs-btn-orange"
                  style={{ padding: '12px 22px', fontSize: '0.88rem' }}
                >
                  Request Official Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            className="gs-modal-quote-container"
            style={{ maxWidth: '760px', background: 'var(--gs-white)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gs-modal-header">
              <div>
                <h2>{packageData.title}</h2>
                <p>Itinerary summary and proposal overview.</p>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="gs-modal-close-btn" aria-label="Close">✕</button>
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--gs-sand-dark)', borderBottom: '1px solid var(--gs-sand-dark)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                <div><strong>Duration:</strong> {packageData.durationDays} Days / {packageData.durationNights} Nights</div>
                <div><strong>Season:</strong> {calculation.seasonLabel}</div>
                <div><strong>Party:</strong> {adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ''}</div>
                <div><strong>Tier:</strong> {accommodationTier} Standard</div>
                <div><strong>Circuit:</strong> {packageData.routeString}</div>
                <div>
                  <strong>Indicative Price:</strong>{' '}
                  <span style={{ color: 'var(--gs-forest)', fontWeight: 'bold' }}>
                    {calculation.isReserveTier ? 'Price to be reviewed' : `$${calculation.indicativePricePerPerson?.toLocaleString()} pp`}
                  </span>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Day-by-Day Route &amp; Activities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
              {packageData.itinerary.map((day) => (
                <div key={day.day} style={{ background: 'var(--gs-sand)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <strong>Day {day.day}: {day.title}</strong> — <em>{day.activity}</em>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)', marginTop: '2px' }}>
                    Route: {day.startLocation} → {day.destination} ({day.travelTime}) | Stay: {day.accommodationBrief}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrintModal(false)}
                className="gs-btn gs-btn-ghost"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="gs-btn gs-btn-orange"
              >
                Print / Save as PDF
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
                <h2>Request Final Quotation</h2>
                <p>We’ll review availability, lock in your preferred season, and email you a tailored proposal.</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="gs-modal-close-btn" aria-label="Close">✕</button>
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
                    placeholder="Your full name"
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
                  placeholder="Dietary requirements, celebrations, room preferences…"
                  rows={3}
                />
              </div>

              {quoteError && (
                <div className="gs-alert gs-alert-error">
                  <span>{quoteError}</span>
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
                className="gs-btn gs-btn-orange gs-btn-full gs-btn-lg"
                disabled={submittingQuote}
              >
                {submittingQuote ? (
                  <>
                    <span className="gs-spinner" /> Submitting Request…
                  </>
                ) : (
                  'Submit Quotation Request'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
