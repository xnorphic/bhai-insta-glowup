-- Clean up dummy data and prepare for live data only

-- Remove dummy Instagram stories
DELETE FROM instagram_stories 
WHERE story_id IN ('story_naukri_001', 'story_swiggy_001')
   OR profile_id IN ('naukridotcom', 'swiggyindia');

-- Remove dummy Instagram profiles (these appear to be test data with placeholder images)
DELETE FROM instagram_profiles 
WHERE profile_id IN ('naukridotcom', 'swiggyindia')
   OR profile_picture_url = 'https://via.placeholder.com/150';

-- Clean up failed sync logs for the dummy profiles
DELETE FROM instagram_sync_logs 
WHERE profile_id IN ('naukridotcom', 'swiggyindia');

-- Update users table to clear connected_instagram_profiles since we removed the dummy ones
UPDATE users 
SET connected_instagram_profiles = '[]'::jsonb
WHERE connected_instagram_profiles::text LIKE '%naukridotcom%' 
   OR connected_instagram_profiles::text LIKE '%swiggyindia%';

-- Clean up any test content calendar events
DELETE FROM content_calendar_events 
WHERE user_input_focus = 'diwali celebration' 
   OR ai_generated_captions::text LIKE '%Mahavir Jayanti%';

-- Clean up test draft data
DELETE FROM drafts 
WHERE content_data::text LIKE '%Appraisal Season%' 
   OR content_data::text LIKE '%Friday Fun%';