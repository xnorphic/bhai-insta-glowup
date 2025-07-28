-- Create mock Instagram content data for naukridotcom and swiggyindia
INSERT INTO public.instagram_content (
  instagram_media_id,
  tracked_profile_id,
  content_type,
  post_type,
  post_date,
  caption,
  thumbnail_url,
  content_link,
  total_likes,
  total_comments,
  total_shares,
  total_views,
  reach,
  impressions,
  saves,
  engagement_rate,
  hashtags,
  mentions,
  last_refreshed_at,
  sync_status,
  performance_category
) VALUES
-- Naukri.com posts
('naukri_001', 'naukridotcom', 'post', 'IMAGE', '2025-01-15 10:00:00+00', 'Start your career journey with us! #CareerGoals #Jobs', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/naukri_001', 15000, 250, 80, 0, 45000, 52000, 320, 8.5, ARRAY['#CareerGoals', '#Jobs'], ARRAY['@naukridotcom'], now(), 'completed', 'Green'),
('naukri_002', 'naukridotcom', 'reel', 'VIDEO', '2025-01-14 14:30:00+00', 'Top 5 interview tips that actually work! 💼 #InterviewTips #CareerAdvice', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/naukri_002', 22000, 420, 150, 35000, 68000, 75000, 580, 9.2, ARRAY['#InterviewTips', '#CareerAdvice'], ARRAY['@naukridotcom'], now(), 'completed', 'Green'),
('naukri_003', 'naukridotcom', 'post', 'IMAGE', '2025-01-13 09:15:00+00', 'Tech jobs are booming! Join the revolution 🚀 #TechJobs #Innovation', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/naukri_003', 18500, 320, 95, 0, 55000, 62000, 410, 7.8, ARRAY['#TechJobs', '#Innovation'], ARRAY['@naukridotcom'], now(), 'completed', 'Green'),
('naukri_004', 'naukridotcom', 'reel', 'VIDEO', '2025-01-12 16:45:00+00', 'Work from home vs Office - Which do you prefer? 🏠💼', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/naukri_004', 28000, 650, 200, 42000, 82000, 95000, 720, 10.1, ARRAY['#WorkFromHome', '#OfficeLife'], ARRAY['@naukridotcom'], now(), 'completed', 'Green'),
('naukri_005', 'naukridotcom', 'post', 'IMAGE', '2025-01-11 11:20:00+00', 'Salary negotiation tips for freshers 💰 #SalaryTips #Freshers', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/naukri_005', 12000, 180, 60, 0, 38000, 44000, 280, 6.5, ARRAY['#SalaryTips', '#Freshers'], ARRAY['@naukridotcom'], now(), 'completed', 'Amber'),

-- Swiggy India posts
('swiggy_001', 'swiggyindia', 'reel', 'VIDEO', '2025-01-15 12:30:00+00', 'When your food arrives faster than expected 😍 #SwiggyMagic #FoodDelivery', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_001', 45000, 850, 320, 65000, 120000, 140000, 1200, 11.2, ARRAY['#SwiggyMagic', '#FoodDelivery'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_002', 'swiggyindia', 'post', 'IMAGE', '2025-01-14 18:45:00+00', 'Monsoon cravings sorted! ☔🍕 #MonsoonSpecial #Pizza', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_002', 32000, 520, 180, 0, 95000, 110000, 850, 9.8, ARRAY['#MonsoonSpecial', '#Pizza'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_003', 'swiggyindia', 'reel', 'VIDEO', '2025-01-13 20:15:00+00', 'Late night cravings? We got you covered! 🌙🍔 #LateNightDelivery #Midnight', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_003', 38000, 680, 250, 58000, 110000, 125000, 950, 10.5, ARRAY['#LateNightDelivery', '#Midnight'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_004', 'swiggyindia', 'post', 'IMAGE', '2025-01-12 13:00:00+00', 'Healthy options for health-conscious foodies! 🥗💚 #HealthyFood #Nutrition', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_004', 28000, 420, 140, 0, 78000, 88000, 650, 8.7, ARRAY['#HealthyFood', '#Nutrition'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_005', 'swiggyindia', 'reel', 'VIDEO', '2025-01-11 15:30:00+00', 'Behind the scenes: How your food reaches you! 📦🛵 #BehindTheScenes #Delivery', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_005', 52000, 920, 380, 75000, 135000, 155000, 1350, 12.1, ARRAY['#BehindTheScenes', '#Delivery'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_006', 'swiggyindia', 'post', 'IMAGE', '2025-01-10 19:20:00+00', 'Weekend special: Comfort food edition 🍛❤️ #WeekendSpecial #ComfortFood', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_006', 35000, 580, 200, 0, 92000, 105000, 780, 9.5, ARRAY['#WeekendSpecial', '#ComfortFood'], ARRAY['@swiggyindia'], now(), 'completed', 'Green'),
('swiggy_007', 'swiggyindia', 'reel', 'VIDEO', '2025-01-09 14:45:00+00', 'Food trends that took over 2024! 📈🍜 #FoodTrends #Viral', 'https://via.placeholder.com/400x400', 'https://instagram.com/p/swiggy_007', 41000, 750, 290, 62000, 118000, 135000, 1100, 10.8, ARRAY['#FoodTrends', '#Viral'], ARRAY['@swiggyindia'], now(), 'completed', 'Green');

-- Update last sync time for both profiles
UPDATE public.instagram_connections 
SET last_sync_at = now()
WHERE username IN ('naukridotcom', 'swiggyindia');