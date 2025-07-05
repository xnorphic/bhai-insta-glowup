
-- Add a table to store Instagram API tokens and connection details
CREATE TABLE public.instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token TEXT,
  profile_picture_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  is_business_account BOOLEAN DEFAULT FALSE,
  account_type TEXT DEFAULT 'personal',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, instagram_user_id)
);

-- Enable RLS on instagram_connections
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instagram_connections
CREATE POLICY "Users can view their own connections" ON public.instagram_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections" ON public.instagram_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all connections" ON public.instagram_connections
  FOR ALL USING (public.is_admin());

-- Create index for better performance
CREATE INDEX idx_instagram_connections_user_id ON public.instagram_connections (user_id);
CREATE INDEX idx_instagram_connections_username ON public.instagram_connections (username);

-- Update the users table to track connected profiles more efficiently
-- Add a function to automatically update connected_instagram_profiles when connections change
CREATE OR REPLACE FUNCTION public.update_user_connected_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the connected_instagram_profiles JSON array in users table
  UPDATE public.users 
  SET connected_instagram_profiles = (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', username,
        'instagram_user_id', instagram_user_id,
        'profile_picture_url', profile_picture_url,
        'follower_count', follower_count,
        'is_business_account', is_business_account,
        'connected_at', connected_at
      )
    ), '[]'::jsonb)
    FROM public.instagram_connections 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
      AND is_active = TRUE
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user's connected profiles
CREATE TRIGGER update_connected_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.instagram_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_user_connected_profiles();

-- Add authentication tables for basic user management
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);
