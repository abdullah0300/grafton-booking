-- ============================================================
-- GDPR 90-day Automated Purge — pg_cron Job
-- Requires pg_cron extension enabled in Supabase
-- Run in Supabase SQL Editor AFTER schema.sql & seed.sql
-- ============================================================

-- Enable pg_cron extension (already available on Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily purge at 02:00 AM UTC
SELECT cron.schedule(
  'purge-unbooked-leads-90days',
  '0 2 * * *',
  $$
    DELETE FROM questionnaire_leads 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND lead_id NOT IN (
      SELECT lead_id FROM bookings 
      WHERE lead_id IS NOT NULL
    );
  $$
);
