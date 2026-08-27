// BookingForm.tsx — Integration Snippet for Main Grafton Website
// ─────────────────────────────────────────────────────────────
// Add this to the existing BookingForm.tsx submit handler in the
// Next.js main website (Storyblok-driven). Replace or extend the
// existing else-branch for Package 8 / "Northern Highlights Small Group".
//
// NOTE: openBookingModal() creates an iframe overlay. See implementation below.

// ── 1. Submit Handler Addition ────────────────────────────────────────────
// Inside the existing handleSubmit() or onSubmit() function:

const BOOKING_APP_URL = 'https://booking.graftonsafaris.com';

// Replace / extend your existing submit logic:
async function handleSubmit(formData: YourFormDataType) {
  // Determine if this is a Package 8 fixed-departure inquiry
  if (selectedTravelType === 'Northern Highlights Small Group') {
    const leadParam = currentLeadId ? `&leadId=${encodeURIComponent(currentLeadId)}` : '';
    const bookingUrl = `${BOOKING_APP_URL}/?package=8${leadParam}`;

    // Primary UX: Open booking app in a sandboxed iframe modal overlay
    openBookingModal(bookingUrl);

    // Alternative (full page navigation — uncomment to use instead):
    // window.location.href = bookingUrl;

  } else {
    // Packages 1–7: Your existing Storyblok booking entry submission
    await submitToStoryblokBookingEntry(formData);
  }
}

// ── 2. openBookingModal() Implementation ──────────────────────────────────
// Add these helpers to BookingForm.tsx (or a dedicated modal utility file).

type BookingCompleteData = {
  bookingReference: string;
  guestName: string;
  packageTitle: string;
  departureDate: string | null;
};

function openBookingModal(url: string): void {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'grafton-booking-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Grafton Safaris Booking');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(26, 58, 42, 0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: gsOverlayFadeIn 200ms ease;
  `;

  // Create iframe container
  const container = document.createElement('div');
  container.style.cssText = `
    background: #faf8f4;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    max-width: 860px;
    max-height: 90vh;
    position: relative;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    animation: gsModalSlideUp 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close booking modal');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    position: absolute; top: 14px; right: 16px; z-index: 10;
    background: rgba(255,255,255,0.9); border: none; cursor: pointer;
    width: 32px; height: 32px; border-radius: 50%;
    font-size: 20px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  closeBtn.onclick = () => closeBookingModal();

  // Sandboxed iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'grafton-booking-iframe';
  iframe.src = url;
  iframe.title = 'Grafton Safaris Booking';
  // Sandbox: allow scripts + forms but restrict navigation of top frame
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin allow-popups');
  iframe.style.cssText = `
    width: 100%; height: 85vh; border: none; display: block;
  `;

  container.appendChild(closeBtn);
  container.appendChild(iframe);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Prevent background scroll
  document.body.style.overflow = 'hidden';

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBookingModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', handleEscapeKey);

  // Listen for postMessage from the booking app iframe
  window.addEventListener('message', handleBookingMessage);
}

function closeBookingModal(): void {
  const overlay = document.getElementById('grafton-booking-overlay');
  if (overlay) {
    overlay.style.animation = 'gsOverlayFadeOut 150ms ease forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleEscapeKey);
  window.removeEventListener('message', handleBookingMessage);
}

function handleEscapeKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeBookingModal();
}

function handleBookingMessage(event: MessageEvent): void {
  // Security: only accept messages from the booking app origin
  const ALLOWED_ORIGIN = 'https://booking.graftonsafaris.com';
  if (event.origin !== ALLOWED_ORIGIN) return;

  const { type, data } = event.data as { type: string; data: BookingCompleteData };

  if (type === 'GRAFTON_BOOKING_COMPLETE') {
    // Booking submitted successfully — close modal and show confirmation toast
    closeBookingModal();
    showBookingSuccessToast(data);
  }
}

function showBookingSuccessToast(data: BookingCompleteData): void {
  // Implement your own toast/notification system here.
  // Example using a simple notification:
  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 10000;
    background: #1a3a2a; color: white;
    padding: 16px 24px; border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    font-family: system-ui, sans-serif;
    animation: gsToastSlideIn 300ms ease;
    max-width: 340px;
  `;
  toast.innerHTML = `
    <div style="font-weight:600; margin-bottom:4px;">🌍 Booking Received!</div>
    <div style="font-size:0.875rem; opacity:0.85;">
      Ref: <strong>${data.bookingReference}</strong><br>
      We'll be in touch within 24–48 hours.
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

// ── 3. Required CSS Keyframes ─────────────────────────────────────────────
// Add to your global CSS file:
/*
@keyframes gsOverlayFadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes gsOverlayFadeOut { from { opacity: 1 } to { opacity: 0 } }
@keyframes gsModalSlideUp   { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
@keyframes gsToastSlideIn   { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
*/
