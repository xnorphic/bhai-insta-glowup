-- Insert the accounts from the script into instagram_connections
INSERT INTO public.instagram_connections (
  user_id,
  instagram_user_id,
  username,
  access_token,
  profile_picture_url,
  follower_count,
  following_count,
  media_count,
  is_business_account,
  account_type
) VALUES 
(
  '9542265f-aeba-4b96-8b76-b805d3d7ba8f',
  'ig_naukridotcom',
  'naukridotcom',
  'mock_access_token_naukri',
  'https://via.placeholder.com/150',
  850000,
  500,
  1200,
  true,
  'business'
),
(
  '9542265f-aeba-4b96-8b76-b805d3d7ba8f',
  'ig_swiggyindia',
  'swiggyindia', 
  'mock_access_token_swiggy',
  'https://via.placeholder.com/150',
  1200000,
  300,
  2500,
  true,
  'business'
)
ON CONFLICT (instagram_user_id) DO UPDATE SET
  username = EXCLUDED.username,
  follower_count = EXCLUDED.follower_count,
  following_count = EXCLUDED.following_count,
  media_count = EXCLUDED.media_count;