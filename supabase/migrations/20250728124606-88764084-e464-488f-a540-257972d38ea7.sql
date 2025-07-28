-- Phase 1: Database Schema Redesign (Fixed)
-- Drop existing Instagram tables
DROP TABLE IF EXISTS public.instagram_content CASCADE;
DROP TABLE IF EXISTS public.instagram_connections CASCADE;
DROP TABLE IF EXISTS public.instagram_sync_logs CASCADE;

-- Drop existing functions that need to be recreated
DROP FUNCTION IF EXISTS public.increment_api_calls(text);
DROP FUNCTION IF EXISTS public.update_user_connected_profiles();

-- Create new instagram_profiles table
CREATE TABLE public.instagram_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  biography TEXT,
  profile_picture_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  is_business_account BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  account_type TEXT DEFAULT 'personal',
  external_url TEXT,
  category TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  api_calls_today INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  api_calls_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create new instagram_media table
CREATE TABLE public.instagram_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  permalink TEXT NOT NULL,
  caption TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC,
  hashtags TEXT[],
  mentions TEXT[],
  location_id TEXT,
  location_name TEXT,
  is_story_available BOOLEAN DEFAULT false,
  video_duration INTEGER,
  children_media JSONB, -- For carousel posts
  insights JSONB, -- Store additional insights
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create new instagram_stories table
CREATE TABLE public.instagram_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- IMAGE, VIDEO
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  story_type TEXT, -- STORY, HIGHLIGHT
  highlight_id TEXT, -- If part of highlight
  stickers JSONB, -- Store story stickers/interactive elements
  mentions TEXT[],
  hashtags TEXT[],
  location_id TEXT,
  location_name TEXT,
  is_archived BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create new sync logs table
CREATE TABLE public.instagram_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'profile', 'media', 'stories', 'full'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  error_message TEXT,
  sync_details JSONB, -- Store additional sync information
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key relationships
ALTER TABLE public.instagram_media 
ADD CONSTRAINT fk_media_profile 
FOREIGN KEY (profile_id) REFERENCES public.instagram_profiles(profile_id) ON DELETE CASCADE;

ALTER TABLE public.instagram_stories 
ADD CONSTRAINT fk_stories_profile 
FOREIGN KEY (profile_id) REFERENCES public.instagram_profiles(profile_id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_instagram_profiles_user_id ON public.instagram_profiles(user_id);
CREATE INDEX idx_instagram_profiles_username ON public.instagram_profiles(username);
CREATE INDEX idx_instagram_media_profile_id ON public.instagram_media(profile_id);
CREATE INDEX idx_instagram_media_timestamp ON public.instagram_media(timestamp);
CREATE INDEX idx_instagram_stories_profile_id ON public.instagram_stories(profile_id);
CREATE INDEX idx_instagram_stories_timestamp ON public.instagram_stories(timestamp);
CREATE INDEX idx_instagram_stories_expires_at ON public.instagram_stories(expires_at);
CREATE INDEX idx_sync_logs_profile_id ON public.instagram_sync_logs(profile_id);
CREATE INDEX idx_sync_logs_started_at ON public.instagram_sync_logs(started_at);

-- Enable Row Level Security
ALTER TABLE public.instagram_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instagram_profiles
CREATE POLICY "Users can view their own profiles" 
ON public.instagram_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profiles" 
ON public.instagram_profiles 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" 
ON public.instagram_profiles 
FOR ALL 
USING (is_admin());

-- Create RLS policies for instagram_media
CREATE POLICY "Users can view media from their profiles" 
ON public.instagram_media 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.instagram_profiles 
  WHERE instagram_profiles.profile_id = instagram_media.profile_id 
  AND instagram_profiles.user_id = auth.uid()
));

CREATE POLICY "System can manage media data" 
ON public.instagram_media 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all media" 
ON public.instagram_media 
FOR ALL 
USING (is_admin());

-- Create RLS policies for instagram_stories
CREATE POLICY "Users can view stories from their profiles" 
ON public.instagram_stories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.instagram_profiles 
  WHERE instagram_profiles.profile_id = instagram_stories.profile_id 
  AND instagram_profiles.user_id = auth.uid()
));

CREATE POLICY "System can manage stories data" 
ON public.instagram_stories 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all stories" 
ON public.instagram_stories 
FOR ALL 
USING (is_admin());

-- Create RLS policies for sync logs
CREATE POLICY "Users can view sync logs for their profiles" 
ON public.instagram_sync_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.instagram_profiles 
  WHERE instagram_profiles.profile_id = instagram_sync_logs.profile_id 
  AND instagram_profiles.user_id = auth.uid()
));

CREATE POLICY "System can manage sync logs" 
ON public.instagram_sync_logs 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all sync logs" 
ON public.instagram_sync_logs 
FOR ALL 
USING (is_admin());

-- Create functions for API call management
CREATE OR REPLACE FUNCTION public.reset_daily_api_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.instagram_profiles 
  SET api_calls_today = 0, 
      api_calls_reset_date = CURRENT_DATE
  WHERE api_calls_reset_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_api_calls(target_profile_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Reset daily count if needed
  PERFORM public.reset_daily_api_calls();
  
  -- Increment counters
  UPDATE public.instagram_profiles 
  SET api_calls_today = api_calls_today + 1,
      total_api_calls = total_api_calls + 1
  WHERE profile_id = target_profile_id;
END;
$$;

-- Create function to update user connected profiles
CREATE OR REPLACE FUNCTION public.update_user_connected_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the connected_instagram_profiles JSON array in users table
  UPDATE public.users 
  SET connected_instagram_profiles = (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', profile_id,
        'username', username,
        'full_name', full_name,
        'profile_picture_url', profile_picture_url,
        'follower_count', follower_count,
        'is_business_account', is_business_account,
        'connected_at', connected_at
      )
    ), '[]'::jsonb)
    FROM public.instagram_profiles 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
      AND is_active = TRUE
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update user connected profiles
CREATE TRIGGER update_user_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.instagram_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_connected_profiles();