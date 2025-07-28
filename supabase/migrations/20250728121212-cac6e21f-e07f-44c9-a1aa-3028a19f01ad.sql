-- Clear mock/test data from instagram_content table
DELETE FROM public.instagram_content 
WHERE tracked_profile_id LIKE 'test_%' 
   OR tracked_profile_id LIKE 'mock_%'
   OR instagram_media_id LIKE 'mock_%'
   OR sync_status = 'mock';

-- Clear any test connections
DELETE FROM public.instagram_connections 
WHERE username LIKE 'test_%' 
   OR username LIKE 'mock_%'
   OR access_token = 'mock_token';

-- Clear any sync logs for test profiles
DELETE FROM public.instagram_sync_logs 
WHERE profile_id LIKE 'test_%' 
   OR profile_id LIKE 'mock_%';

-- Update any existing real connections to use the correct sync status
UPDATE public.instagram_content 
SET sync_status = 'pending'
WHERE sync_status IS NULL OR sync_status = '';

-- Add indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_instagram_content_tracked_profile_id ON public.instagram_content(tracked_profile_id);
CREATE INDEX IF NOT EXISTS idx_instagram_content_post_date ON public.instagram_content(post_date);
CREATE INDEX IF NOT EXISTS idx_instagram_content_performance_category ON public.instagram_content(performance_category);
CREATE INDEX IF NOT EXISTS idx_instagram_connections_username ON public.instagram_connections(username);
CREATE INDEX IF NOT EXISTS idx_instagram_connections_user_id ON public.instagram_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_sync_logs_profile_id ON public.instagram_sync_logs(profile_id);