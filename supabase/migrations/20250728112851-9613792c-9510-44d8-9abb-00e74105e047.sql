-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule Instagram sync to run twice daily (8 AM and 8 PM UTC)
SELECT cron.schedule(
  'instagram-sync-morning',
  '0 8 * * *', -- 8 AM UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-cron-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
        body:='{"sync_type": "auto"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'instagram-sync-evening',
  '0 20 * * *', -- 8 PM UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-cron-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
        body:='{"sync_type": "auto"}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger sync for testing
CREATE OR REPLACE FUNCTION public.trigger_manual_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://iasrhvglfayqogxkfaiw.supabase.co/functions/v1/instagram-cron-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3JodmdsZmF5cW9neGtmYWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyOTg1OSwiZXhwIjoyMDY3MzA1ODU5fQ.xxdKKgqcLN9iw3F8fqJE2jdEjOqH3tGe-9NkZNyFJ0w"}'::jsonb,
    body := '{"sync_type": "full"}'::jsonb
  );
END;
$$;