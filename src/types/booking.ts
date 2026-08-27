// src/types/booking.ts
// TypeScript interfaces for the Grafton Safaris Booking System

export interface Package {
  id: number;
  slug: string;
  title: string;
  duration: string;
  indicative_price: number;
  is_fixed_departure: boolean;
}

export interface FixedDeparture {
  id: string;
  package_id: number;
  departure_date: string;
  return_date: string;
  max_capacity: number;
  booked_seats: number;
  available_seats: number; // computed: max_capacity - booked_seats
  price_per_person: number;
  single_supplement_price: number;
  status: 'available' | 'guaranteed' | 'sold_out' | 'cancelled';
}

export interface QuestionnaireLead {
  id: string;
  lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  arrival_date: string | null;
  duration: string | null;
  adults: number;
  children: number;
  preferences: Record<string, unknown>;
  created_at: string;
}

export interface BookingFormData {
  // Contact
  full_name: string;
  email: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;

  // Safari Details
  package_id: number;
  travel_type: string;
  departure_id?: string;         // Only for Package 8
  arrival_date?: string;          // Only for Packages 1–7
  travel_duration?: string;
  adults: number;
  children: number;
  single_room_requested: boolean;
  custom_message?: string;

  // Pre-fill
  lead_id?: string;
  preferences?: Record<string, unknown>;
}

export interface Booking {
  id: string;
  booking_reference: string;
  package_id: number;
  departure_id: string | null;
  lead_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  gender: string | null;
  date_of_birth: string | null;
  travel_type: string;
  arrival_date: string | null;
  travel_duration: string | null;
  adults: number;
  children: number;
  single_room_requested: boolean;
  custom_message: string | null;
  preferences: Record<string, unknown>;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  gateway: 'stripe' | 'dpo' | 'pesapal' | 'manual';
  transaction_reference: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeadPrefillResponse {
  full_name?: string;
  email?: string;
  phone?: string;
  arrival_date?: string;
  duration?: string;
  adults?: number;
  children?: number;
  preferences?: Record<string, unknown>;
}

export interface BookingSubmitResponse {
  booking_reference: string;
  booking_id: string;
}
