-- ============================================================
-- Grafton Safaris Booking System — Supabase Schema
-- Apply this in the Supabase SQL Editor
-- ============================================================

-- 1. packages
CREATE TABLE IF NOT EXISTS packages (
  id INT PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  indicative_price NUMERIC(10, 2),
  is_fixed_departure BOOLEAN DEFAULT FALSE
);

-- 2. fixed_departures (Package 8 only)
CREATE TABLE IF NOT EXISTS fixed_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id INT REFERENCES packages(id),
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  max_capacity INT DEFAULT 6,
  booked_seats INT DEFAULT 0,
  price_per_person NUMERIC(10, 2) NOT NULL,
  single_supplement_price NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'available'
    CHECK (status IN ('available', 'guaranteed', 'sold_out', 'cancelled'))
);

-- 3. questionnaire_leads
CREATE TABLE IF NOT EXISTS questionnaire_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  arrival_date DATE,
  duration VARCHAR(100),
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  package_id INT REFERENCES packages(id),
  departure_id UUID REFERENCES fixed_departures(id) NULL,
  lead_id VARCHAR(50) REFERENCES questionnaire_leads(lead_id) NULL,

  -- Contact
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NOT NULL,
  gender VARCHAR(50),
  date_of_birth DATE,

  -- Safari Details
  travel_type VARCHAR(255) NOT NULL,
  arrival_date DATE,
  travel_duration VARCHAR(100),
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  single_room_requested BOOLEAN DEFAULT FALSE,
  custom_message TEXT,

  -- Preferences snapshot (immutable copy at booking time)
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Statuses
  booking_status VARCHAR(50) DEFAULT 'pending'
    CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'deposit_paid', 'fully_paid', 'refunded')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. payments (pluggable gateway layer)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  gateway VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(255) UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_id ON bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_fixed_departures_package_id ON fixed_departures(package_id);
CREATE INDEX IF NOT EXISTS idx_fixed_departures_status ON fixed_departures(status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_leads_created_at ON questionnaire_leads(created_at);

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================
ALTER TABLE questionnaire_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow server-side (service_role) full access; restrict anon
CREATE POLICY "Service role full access - questionnaire_leads"
  ON questionnaire_leads FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - bookings"
  ON bookings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- Packages & fixed_departures: public read, service_role write
CREATE POLICY "Public read packages"
  ON packages FOR SELECT USING (true);

CREATE POLICY "Service role write packages"
  ON packages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public read fixed_departures"
  ON fixed_departures FOR SELECT USING (true);

CREATE POLICY "Service role write fixed_departures"
  ON fixed_departures FOR ALL
  USING (auth.role() = 'service_role');
