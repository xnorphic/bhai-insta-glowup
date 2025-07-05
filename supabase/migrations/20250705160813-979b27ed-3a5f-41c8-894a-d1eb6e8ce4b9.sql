
-- Create ENUM types first
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'trial', 'paused');
CREATE TYPE content_type AS ENUM ('post', 'reel', 'carousel', 'story', 'highlight');
CREATE TYPE performance_category AS ENUM ('Green', 'Amber', 'Red');
CREATE TYPE api_name AS ENUM ('OpenAI', 'StarAPI');
CREATE TYPE platform_type AS ENUM ('twitter', 'linkedin', 'youtube', 'instagram');
CREATE TYPE calendar_content_type AS ENUM ('post', 'reel', 'story', 'carousel', 'video', 'short');
CREATE TYPE post_category AS ENUM ('festival', 'launch', 'branding', 'educational', 'meme', 'topical');

-- Create users table (extending Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  profile_picture_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  current_subscription_status subscription_status DEFAULT 'trial' NOT NULL,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_expiry_date TIMESTAMP WITH TIME ZONE,
  connected_instagram_profiles JSONB DEFAULT '[]'::jsonb NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT max_instagram_profiles CHECK (jsonb_array_length(connected_instagram_profiles) <= 4)
);

-- Create instagram_content table
CREATE TABLE public.instagram_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_profile_id TEXT NOT NULL,
  instagram_media_id TEXT NOT NULL,
  content_link TEXT NOT NULL,
  content_type content_type NOT NULL,
  post_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_likes INTEGER DEFAULT 0 NOT NULL,
  total_comments INTEGER DEFAULT 0 NOT NULL,
  total_shares INTEGER DEFAULT 0 NOT NULL,
  total_views INTEGER DEFAULT 0 NOT NULL,
  audio_used TEXT,
  alt_text TEXT,
  location_id BIGINT,
  location_name TEXT,
  thumbnail_url TEXT NOT NULL,
  caption TEXT,
  ai_sentiment_summary TEXT,
  is_boosted BOOLEAN DEFAULT FALSE NOT NULL,
  performance_category performance_category,
  ai_performance_summary TEXT,
  last_refreshed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(instagram_media_id, tracked_profile_id)
);

-- Create api_usage_logs table
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  api_name api_name NOT NULL,
  endpoint_called TEXT NOT NULL,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status_code INTEGER,
  request_payload JSONB,
  response_data JSONB,
  error_message TEXT,
  is_error BOOLEAN DEFAULT FALSE NOT NULL,
  cost_in_units NUMERIC,
  api_key_used TEXT
);

-- Create brand_books table
CREATE TABLE public.brand_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  uploaded_by_username TEXT NOT NULL,
  version INTEGER NOT NULL,
  ai_summary_json JSONB,
  ai_generated_playbook TEXT,
  posts_scanned_for_playbook INTEGER DEFAULT 0 NOT NULL,
  playbook_start_year INTEGER
);

-- Create content_calendar_events table
CREATE TABLE public.content_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  platform platform_type NOT NULL,
  content_type calendar_content_type NOT NULL,
  post_category post_category NOT NULL,
  user_input_focus TEXT,
  ai_generated_captions JSONB,
  ai_generated_post_ideas TEXT NOT NULL,
  ai_generated_image_prompts TEXT,
  ai_reasoning TEXT NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE NOT NULL,
  creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT one_saved_per_day UNIQUE (user_id, event_date, is_saved) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users (username);
CREATE INDEX idx_instagram_content_profile_id ON public.instagram_content (tracked_profile_id);
CREATE INDEX idx_instagram_content_post_date ON public.instagram_content (post_date DESC);
CREATE INDEX idx_api_usage_user_id ON public.api_usage_logs (user_id);
CREATE INDEX idx_api_usage_timestamp ON public.api_usage_logs (request_timestamp DESC);
CREATE INDEX idx_api_usage_api_name ON public.api_usage_logs (api_name);
CREATE INDEX idx_brand_books_user_id ON public.brand_books (user_id);
CREATE INDEX idx_brand_books_version ON public.brand_books (version DESC);
CREATE INDEX idx_calendar_user_id ON public.content_calendar_events (user_id);
CREATE INDEX idx_calendar_event_date ON public.content_calendar_events (event_date);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = auth.uid()), FALSE);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_instagram_profile(profile_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND connected_instagram_profiles @> jsonb_build_array(jsonb_build_object('id', profile_id))
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- RLS Policies for instagram_content table
CREATE POLICY "Users can view content from their profiles" ON public.instagram_content
  FOR SELECT USING (public.user_has_instagram_profile(tracked_profile_id));

CREATE POLICY "Admins can view all content" ON public.instagram_content
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all content" ON public.instagram_content
  FOR ALL USING (public.is_admin());

-- RLS Policies for api_usage_logs table
CREATE POLICY "Users can view their own logs" ON public.api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON public.api_usage_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert logs" ON public.api_usage_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for brand_books table
CREATE POLICY "Users can manage their own brand books" ON public.brand_books
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all brand books" ON public.brand_books
  FOR ALL USING (public.is_admin());

-- RLS Policies for content_calendar_events table
CREATE POLICY "Users can manage their own calendar events" ON public.content_calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all calendar events" ON public.content_calendar_events
  FOR ALL USING (public.is_admin());

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert admin user (you'll need to create this user through Supabase Auth first)
-- This is a placeholder - you'll need to replace with actual UUID after creating the auth user
-- INSERT INTO public.users (id, username, is_admin, current_subscription_status) 
-- VALUES ('REPLACE_WITH_ACTUAL_UUID', 'aditya@bhai.com', TRUE, 'active');

-- Function to validate one saved calendar event per day
CREATE OR REPLACE FUNCTION public.validate_one_saved_per_day()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_saved = TRUE THEN
    -- Remove other saved events for the same user and date
    UPDATE public.content_calendar_events 
    SET is_saved = FALSE 
    WHERE user_id = NEW.user_id 
      AND event_date = NEW.event_date 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_saved = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_saved_per_day
  BEFORE INSERT OR UPDATE ON public.content_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_one_saved_per_day();
