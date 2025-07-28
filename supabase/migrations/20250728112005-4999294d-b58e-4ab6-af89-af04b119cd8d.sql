-- Fix remaining functions with proper search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.user_has_instagram_profile(profile_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND connected_instagram_profiles @> jsonb_build_array(jsonb_build_object('id', profile_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.update_user_connected_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_one_saved_per_day()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;