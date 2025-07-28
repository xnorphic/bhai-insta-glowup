-- Phase 3: Set up automated scheduling for Instagram sync
-- Create cron job to run at 8 AM and 8 PM IST (2:30 AM and 2:30 PM UTC)

-- First, ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the Instagram sync to run twice daily
-- 8:00 AM IST = 2:30 AM UTC (IST is UTC+5:30)
-- 8:00 PM IST = 2:30 PM UTC
SELECT cron.schedule(
  'instagram-sync-morning',
  '30 2 * * *', -- 2:30 AM UTC = 8:00 AM IST
  $$
  SELECT net.http_post(
    url := 'https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
    body := '{"force": true, "sync_type": "auto"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'instagram-sync-evening',
  '30 14 * * *', -- 2:30 PM UTC = 8:00 PM IST
  $$
  SELECT net.http_post(
    url := 'https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
    body := '{"force": true, "sync_type": "auto"}'::jsonb
  ) as request_id;
  $$
);

-- Update manual sync function to use new scheduler
CREATE OR REPLACE FUNCTION public.trigger_manual_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
    body := '{"force": true, "sync_type": "full"}'::jsonb
  );
END;
$$;