// src/lib/pricingEngine.ts
// Grafton Safaris Dynamic Pricing Engine
// Calculates real-time indicative prices based on seasonality, party size vehicle sharing,
// accommodation tiers, room allocations, child rates, and add-on experiences.

import { SafariPackage, SafariAddon } from '@/data/packages';

export type SeasonType = 'Green' | 'Shoulder' | 'Peak' | 'Calving' | 'Migration';

export type PricingStatus =
  | 'Indicative estimate – automatically calculated'
  | 'Under Grafton review – submitted to a consultant'
  | 'Final quotation – manually reviewed and issued'
  | 'Accepted, subject to availability'
  | 'Confirmed – suppliers confirmed and deposit received';

export interface PriceCalculationInput {
  packageData: SafariPackage;
  travelDate?: string; // ISO YYYY-MM-DD
  travelMonth?: string; // e.g. 'August'
  adults: number;
  children: number;
  singleRooms: number;
  accommodationTier: 'Comfort' | 'Signature' | 'Reserve';
  selectedAddonIds: string[];
  allAddons?: SafariAddon[];
}

export interface PriceCalculationResult {
  season: SeasonType;
  seasonLabel: string;
  isReserveTier: boolean;
  priceStatus: PricingStatus;
  indicativePricePerPerson: number | null; // null if Reserve tier
  indicativeTotalPrice: number | null;     // null if Reserve tier
  breakdown: {
    basePerAdult: number;
    basePerChild: number;
    seasonMultiplier: number;
    tierMultiplier: number;
    vehicleCostSavingPerPerson: number; // savings for 4 or 6 guests sharing 4x4
    singleSupplementTotal: number;
    addonsTotal: number;
    adultsSubtotal: number;
    childrenSubtotal: number;
  };
  disclaimer: string;
}

/**
 * Determine the season based on travel date or travel month
 */
export function getSeasonForDate(dateStr?: string, monthStr?: string, packageId?: number): SeasonType {
  let month = 0; // 1-12
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      month = d.getMonth() + 1;
    }
  } else if (monthStr) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    const idx = months.indexOf(monthStr.toLowerCase());
    if (idx !== -1) month = idx + 1;
  }

  if (month === 0) month = 8; // default to August (Peak)

  // Calving Season override for Package 2
  if (packageId === 2 && (month === 1 || month === 2 || month === 3)) {
    return 'Calving';
  }

  // Migration River Crossing override for Package 1
  if (packageId === 1 && (month >= 7 && month <= 10)) {
    return 'Migration';
  }

  // Standard Northern & Southern Circuit Seasonality
  // Green: April, May, November
  if (month === 4 || month === 5 || month === 11) {
    return 'Green';
  }
  // Peak: July, August, September, October, Festive late Dec
  if (month >= 7 && month <= 10) {
    return 'Peak';
  }
  // Shoulder: January, February, March, June, December
  return 'Shoulder';
}

/**
 * Season price multipliers relative to base
 */
const SEASON_MULTIPLIERS: Record<SeasonType, number> = {
  Green: 0.88,       // 12% discount in green season
  Shoulder: 1.0,     // Standard baseline
  Peak: 1.18,        // 18% peak surcharge for high season park fees & lodges
  Calving: 1.12,     // 12% surcharge for peak calving herds
  Migration: 1.22,   // 22% surcharge for river crossing camps
};

/**
 * Calculate dynamic price for a Grafton itinerary
 */
export function calculateItineraryPrice(input: PriceCalculationInput): PriceCalculationResult {
  const {
    packageData,
    travelDate,
    travelMonth,
    adults,
    children,
    singleRooms,
    accommodationTier,
    selectedAddonIds,
    allAddons = [],
  } = input;

  const totalGuests = Math.max(1, adults + children);
  const season = getSeasonForDate(travelDate, travelMonth, packageData.id);
  const seasonMultiplier = SEASON_MULTIPLIERS[season];

  const seasonLabels: Record<SeasonType, string> = {
    Green: 'Green Season (Emerald Plains & Great Value)',
    Shoulder: 'Shoulder Season (Warm & Balanced)',
    Peak: 'Peak Dry Season (Prime Game Viewing)',
    Calving: 'Calving Season (Ndutu Plains Nursery)',
    Migration: 'Mara River Crossing Season (Peak Migration)',
  };

  // Special rule: Reserve tier is custom-contracted luxury
  if (accommodationTier === 'Reserve') {
    return {
      season,
      seasonLabel: seasonLabels[season],
      isReserveTier: true,
      priceStatus: 'Under Grafton review – submitted to a consultant',
      indicativePricePerPerson: null,
      indicativeTotalPrice: null,
      breakdown: {
        basePerAdult: 0,
        basePerChild: 0,
        seasonMultiplier,
        tierMultiplier: 1.8,
        vehicleCostSavingPerPerson: 0,
        singleSupplementTotal: 0,
        addonsTotal: 0,
        adultsSubtotal: 0,
        childrenSubtotal: 0,
      },
      disclaimer:
        'Reserve Tier itineraries feature private villas, fly-in charters, and exclusive-use camps. Pricing is tailored on request.',
    };
  }

  // Determine base adult rate according to tier
  let baseAdultRate = packageData.basePriceComfort;
  let tierMultiplier = 1.0;

  if (accommodationTier === 'Signature') {
    baseAdultRate = packageData.basePriceSignature;
    tierMultiplier = packageData.basePriceSignature / Math.max(1, packageData.basePriceComfort);
  }

  // Vehicle cost sharing calculation:
  // 2 guests absorb full private vehicle daily cost
  // 4 guests save ~$280 per person across journey
  // 6 guests save ~$420 per person across journey
  let vehicleCostSaving = 0;
  if (!packageData.isFixedDeparture) {
    if (totalGuests >= 6) {
      vehicleCostSaving = 420;
    } else if (totalGuests >= 4) {
      vehicleCostSaving = 280;
    }
  }

  const adjustedAdultBase = Math.round((baseAdultRate * seasonMultiplier) - vehicleCostSaving);
  // Children (under 12) travel at 68% of adult rate (reduced park fees & sharing room)
  const adjustedChildBase = Math.round(adjustedAdultBase * 0.68);

  const adultsSubtotal = adjustedAdultBase * adults;
  const childrenSubtotal = adjustedChildBase * children;

  // Single Room Supplement (~$750 - $950 depending on journey length)
  const singleSupplementRatePerRoom = Math.round(packageData.durationNights * 95);
  const singleSupplementTotal = singleRooms * singleSupplementRatePerRoom;

  // Addons total
  let addonsTotal = 0;
  if (selectedAddonIds && selectedAddonIds.length > 0) {
    for (const addonId of selectedAddonIds) {
      const addon = allAddons.find((a) => a.id === addonId);
      if (addon) {
        // Assume all adults participate unless specified
        addonsTotal += addon.pricePerPerson * adults;
      }
    }
  }

  const indicativeTotalPrice = adultsSubtotal + childrenSubtotal + singleSupplementTotal + addonsTotal;
  const indicativePricePerPerson = Math.round(indicativeTotalPrice / totalGuests);

  return {
    season,
    seasonLabel: seasonLabels[season],
    isReserveTier: false,
    priceStatus: 'Indicative estimate – automatically calculated',
    indicativePricePerPerson,
    indicativeTotalPrice,
    breakdown: {
      basePerAdult: adjustedAdultBase,
      basePerChild: adjustedChildBase,
      seasonMultiplier,
      tierMultiplier,
      vehicleCostSavingPerPerson: vehicleCostSaving,
      singleSupplementTotal,
      addonsTotal,
      adultsSubtotal,
      childrenSubtotal,
    },
    disclaimer:
      'Indicative estimate in USD based on selected season and party size. Accommodation, flights, and permits remain subject to availability until confirmed.',
  };
}
