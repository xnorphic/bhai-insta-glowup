-- Fix security warnings by setting proper search paths
CREATE OR REPLACE FUNCTION public.reset_daily_api_calls()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.instagram_connections 
  SET api_calls_today = 0, 
      api_calls_reset_date = CURRENT_DATE
  WHERE api_calls_reset_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_api_calls(profile_username text)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Reset daily count if needed
  PERFORM public.reset_daily_api_calls();
  
  -- Increment counters
  UPDATE public.instagram_connections 
  SET api_calls_today = api_calls_today + 1,
      total_api_calls = total_api_calls + 1
  WHERE username = profile_username;
END;
$$;