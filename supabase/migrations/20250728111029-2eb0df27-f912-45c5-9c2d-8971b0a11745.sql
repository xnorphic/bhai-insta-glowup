-- Add new columns to instagram_content table for enhanced analytics
ALTER TABLE public.instagram_content 
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_plays INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS content_duration INTEGER,
ADD COLUMN IF NOT EXISTS post_type TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instagram_content_sync_status ON public.instagram_content(sync_status);
CREATE INDEX IF NOT EXISTS idx_instagram_content_tracked_profile ON public.instagram_content(tracked_profile_id);
CREATE INDEX IF NOT EXISTS idx_instagram_content_post_date ON public.instagram_content(post_date);

-- Create table for sync logs
CREATE TABLE IF NOT EXISTS public.instagram_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('profile', 'content', 'full')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sync logs
ALTER TABLE public.instagram_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for sync logs
CREATE POLICY "Users can view sync logs for their profiles" 
ON public.instagram_sync_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.instagram_connections ic 
    WHERE ic.username = profile_id 
    AND ic.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage sync logs" 
ON public.instagram_sync_logs 
FOR ALL 
USING (true);

-- Add API usage tracking columns to instagram_connections
ALTER TABLE public.instagram_connections 
ADD COLUMN IF NOT EXISTS api_calls_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_api_calls INTEGER DEFAULT 0;

-- Create function to reset daily API calls
CREATE OR REPLACE FUNCTION public.reset_daily_api_calls()
RETURNS void AS $$
BEGIN
  UPDATE public.instagram_connections 
  SET api_calls_today = 0, 
      api_calls_reset_date = CURRENT_DATE
  WHERE api_calls_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment API calls
CREATE OR REPLACE FUNCTION public.increment_api_calls(profile_username text)
RETURNS void AS $$
BEGIN
  -- Reset daily count if needed
  PERFORM public.reset_daily_api_calls();
  
  -- Increment counters
  UPDATE public.instagram_connections 
  SET api_calls_today = api_calls_today + 1,
      total_api_calls = total_api_calls + 1
  WHERE username = profile_username;
END;
$$ LANGUAGE plpgsql;