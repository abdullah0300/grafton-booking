-- ============================================================
-- Grafton Safaris Booking System — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- Packages
INSERT INTO packages (id, slug, title, duration, indicative_price, is_fixed_departure) VALUES
  (1, 'kenya-masai-mara', 'Kenya Masai Mara Safari', '7 Days', 3500.00, false),
  (2, 'tanzania-serengeti', 'Tanzania Serengeti & Ngorongoro', '8 Days', 4200.00, false),
  (3, 'amboseli-kilimanjaro', 'Amboseli & Kilimanjaro Views', '5 Days', 2800.00, false),
  (4, 'uganda-gorillas', 'Uganda Gorilla Trekking', '6 Days', 5500.00, false),
  (5, 'rwanda-primates', 'Rwanda Primate Safari', '5 Days', 4800.00, false),
  (6, 'botswana-okavango', 'Botswana Okavango Delta', '9 Days', 7200.00, false),
  (7, 'south-africa-classic', 'South Africa Classic Safari', '10 Days', 6500.00, false),
  (8, 'northern-highlights-small-group', 'Northern Highlights Small Group', '11 Days', 4950.00, true)
ON CONFLICT (id) DO NOTHING;

-- Package 8 Fixed Departures (starting Jan 04, 2027 — 6 initial dates)
INSERT INTO fixed_departures (package_id, departure_date, return_date, max_capacity, booked_seats, price_per_person, single_supplement_price, status) VALUES
  (8, '2027-01-04', '2027-01-14', 6, 0, 4950.00, 750.00, 'available'),
  (8, '2027-02-01', '2027-02-11', 6, 0, 4950.00, 750.00, 'available'),
  (8, '2027-03-15', '2027-03-25', 6, 0, 4950.00, 750.00, 'available'),
  (8, '2027-06-07', '2027-06-17', 6, 0, 5250.00, 800.00, 'available'),
  (8, '2027-08-10', '2027-08-20', 6, 0, 5250.00, 800.00, 'available'),
  (8, '2027-10-05', '2027-10-15', 6, 0, 4950.00, 750.00, 'available')
ON CONFLICT DO NOTHING;
