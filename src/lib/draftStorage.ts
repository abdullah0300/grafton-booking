// src/lib/draftStorage.ts
// 30-Day LocalStorage persistence for anonymous itinerary drafts
// Enables saving multiple drafts, comparing, restoring, and exporting to Supabase

export interface SavedItineraryDraft {
  id: string; // uuid / slug
  packageId: number;
  packageTitle: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt: string; // ISO (+30 days)
  travelDate?: string;
  travelMonth?: string;
  adults: number;
  children: number;
  childAges?: number[];
  rooms: {
    doubleRooms: number;
    twinRooms: number;
    singleRooms: number;
    familyRooms: number;
  };
  accommodationTier: 'Comfort' | 'Signature' | 'Reserve';
  transportPreference: 'Primarily road' | 'Road plus selected flights' | 'Fly-in safari';
  pace: 'Relaxed' | 'Balanced' | 'Active';
  selectedAddonIds: string[];
  customNotes?: string;
  indicativePricePerPerson: number | null;
  indicativeTotalPrice: number | null;
  currency: string;
}

const DRAFT_STORAGE_KEY = 'grafton_safari_drafts_v1';
const EXPIRY_DAYS = 30;

export function getSavedDrafts(): SavedItineraryDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const drafts: SavedItineraryDraft[] = JSON.parse(raw);
    const now = new Date().getTime();
    // Filter out expired drafts
    const valid = drafts.filter((d) => new Date(d.expiresAt).getTime() > now);
    if (valid.length !== drafts.length) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch (err) {
    console.error('[DraftStorage] Failed to read drafts:', err);
    return [];
  }
}

export function saveItineraryDraft(draft: Omit<SavedItineraryDraft, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'> & { id?: string }): SavedItineraryDraft {
  if (typeof window === 'undefined') {
    throw new Error('Drafts can only be saved in client browser environment');
  }

  const existing = getSavedDrafts();
  const now = new Date();
  const expires = new Date();
  expires.setDate(now.getDate() + EXPIRY_DAYS);

  const id = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullDraft: SavedItineraryDraft = {
    ...draft,
    id,
    createdAt: draft.id ? (existing.find((d) => d.id === draft.id)?.createdAt || now.toISOString()) : now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const updatedList = [fullDraft, ...existing.filter((d) => d.id !== id)].slice(0, 10); // keep up to 10 drafts
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedList));

  return fullDraft;
}

export function removeItineraryDraft(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getSavedDrafts();
  const filtered = existing.filter((d) => d.id !== id);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filtered));
}

export function generateShareableUrl(draft: SavedItineraryDraft): string {
  if (typeof window === 'undefined') return '';
  const base = window.location.origin;
  const params = new URLSearchParams({
    package: draft.packageId.toString(),
    tier: draft.accommodationTier,
    adults: draft.adults.toString(),
    children: draft.children.toString(),
    singles: draft.rooms.singleRooms.toString(),
  });
  if (draft.travelDate) params.set('date', draft.travelDate);
  if (draft.travelMonth) params.set('month', draft.travelMonth);
  if (draft.selectedAddonIds.length > 0) params.set('addons', draft.selectedAddonIds.join(','));

  return `${base}/?${params.toString()}`;
}
