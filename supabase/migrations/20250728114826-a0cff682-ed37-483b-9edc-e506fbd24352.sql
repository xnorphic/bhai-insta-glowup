-- Update existing accounts with the script data 
UPDATE public.instagram_connections 
SET 
  username = 'naukridotcom',
  follower_count = 850000,
  following_count = 500,
  media_count = 1200
WHERE username = 'demo_account';

-- Insert the Swiggy account
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
  'ig_swiggyindia',
  'swiggyindia', 
  'mock_access_token_swiggy',
  'https://via.placeholder.com/150',
  1200000,
  300,
  2500,
  true,
  'business'
);