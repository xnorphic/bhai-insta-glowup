-- Phase 5: Create sample data for testing the new system
-- Insert sample Instagram profiles
INSERT INTO public.instagram_profiles (
  profile_id, user_id, username, full_name, biography, profile_picture_url,
  follower_count, following_count, media_count, is_business_account, is_verified,
  account_type, connected_at, last_sync_at, is_active
) VALUES 
(
  'naukridotcom', 
  '9542265f-aeba-4b96-8b76-b805d3d7ba8f'::uuid, 
  'naukridotcom', 
  'Naukri.com - Official', 
  'India''s leading job portal. Find your dream job today! 🚀',
  'https://via.placeholder.com/150',
  850000, 1200, 2500, true, true, 'business',
  now() - interval '7 days', now() - interval '1 hour', true
),
(
  'swiggyindia', 
  '9542265f-aeba-4b96-8b76-b805d3d7ba8f'::uuid, 
  'swiggyindia', 
  'Swiggy', 
  'Order food online from your favorite restaurants 🍕🍔',
  'https://via.placeholder.com/150',
  1200000, 800, 3200, true, true, 'business',
  now() - interval '5 days', now() - interval '2 hours', true
);

-- Note: Sample media data already exists from previous migration
-- Let's also add some sample stories
INSERT INTO public.instagram_stories (
  story_id, profile_id, media_type, media_url, thumbnail_url,
  timestamp, expires_at, view_count, reply_count, story_type,
  mentions, hashtags, last_updated
) VALUES 
(
  'story_naukri_001', 'naukridotcom', 'IMAGE',
  'https://via.placeholder.com/400x600', 'https://via.placeholder.com/200x300',
  now() - interval '12 hours', now() + interval '12 hours',
  5200, 45, 'STORY',
  ARRAY['@naukridotcom'], ARRAY['#JobAlert', '#Career'],
  now()
),
(
  'story_swiggy_001', 'swiggyindia', 'VIDEO', 
  'https://via.placeholder.com/400x600', 'https://via.placeholder.com/200x300',
  now() - interval '8 hours', now() + interval '16 hours',
  12500, 120, 'STORY',
  ARRAY['@swiggyindia'], ARRAY['#FoodDelivery', '#FastFood'],
  now()
);

-- Update the sample media data to use correct profile_ids
UPDATE public.instagram_media 
SET profile_id = 'naukridotcom' 
WHERE profile_id = 'naukridotcom';

UPDATE public.instagram_media 
SET profile_id = 'swiggyindia' 
WHERE profile_id = 'swiggyindia';