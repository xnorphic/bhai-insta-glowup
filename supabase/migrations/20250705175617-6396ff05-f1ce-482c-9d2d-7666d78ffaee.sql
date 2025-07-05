
-- The content_calendar_events table already exists, but let's add some enhancements for better functionality
-- Add indexes for better performance on date-based queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_user ON public.content_calendar_events (event_date, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_saved ON public.content_calendar_events (is_saved, user_id);

-- Create a table for storing important dates/occasions
CREATE TABLE IF NOT EXISTS public.important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_month TEXT NOT NULL, -- e.g., "1 January", "March (varies)"
  name TEXT NOT NULL,
  occasion_type TEXT NOT NULL, -- e.g., "International", "Hindu Festival"
  region_notes TEXT,
  is_fixed_date BOOLEAN DEFAULT TRUE, -- false for dates that vary each year
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert the calendar data provided by the user
INSERT INTO public.important_dates (date_month, name, occasion_type, region_notes, is_fixed_date) VALUES
('1 January', 'New Year''s Day', 'International', '', true),
('13-15 January', 'Lohri / Makar Sankranti / Pongal / Bihu', 'Regional', 'North, South, East India', true),
('26 January', 'Republic Day', 'National', '', true),
('February (varies)', 'Maha Shivaratri', 'Hindu Festival', '', false),
('4 February', 'World Cancer Day', 'International', '', true),
('March (varies)', 'Holi', 'Hindu Festival', 'North India', false),
('8 March', 'International Women''s Day', 'International', '', true),
('22 March', 'World Water Day', 'International', '', true),
('March/April (varies)', 'Ram Navami', 'Hindu Festival', '', false),
('March/April (varies)', 'Good Friday', 'Christian Festival', '', false),
('7 April', 'World Health Day', 'International', '', true),
('14 April', 'Baisakhi / Vishu / Pohela Boishakh / Puthandu / Bihu', 'Regional New Year', 'Punjab, Kerala, Bengal, Tamil Nadu, Assam', true),
('April (varies)', 'Mahavir Jayanti', 'Jain Festival', '', false),
('22 April', 'Earth Day', 'International', '', true),
('May (varies)', 'Eid-ul-Fitr', 'Islamic Festival', '', false),
('May (varies)', 'Buddha Purnima', 'Buddhist Festival', '', false),
('June (varies)', 'Rath Yatra', 'Hindu Festival', 'Odisha', false),
('5 June', 'World Environment Day', 'International', '', true),
('21 June', 'International Yoga Day', 'International', '', true),
('July (varies)', 'Eid-ul-Adha (Bakrid)', 'Islamic Festival', '', false),
('July (varies)', 'Amazon Prime Day Sale', 'E-commerce', '', false),
('August (varies)', 'Raksha Bandhan', 'Hindu Festival', '', false),
('August (varies)', 'Janmashtami', 'Hindu Festival', '', false),
('August (varies)', 'Onam', 'Regional', 'Kerala', false),
('15 August', 'Independence Day', 'National', '', true),
('August (varies)', 'Independence Day Sale (E-commerce)', 'E-commerce', '', false),
('September (varies)', 'Ganesh Chaturthi', 'Hindu Festival', 'Maharashtra, South India', false),
('September/October (varies)', 'Navratri / Durga Puja / Dussehra', 'Hindu Festival', 'Pan-India, Bengal', false);

-- Enable RLS on important_dates table
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read important dates (public data)
CREATE POLICY "Anyone can view important dates" ON public.important_dates
  FOR SELECT USING (true);

-- Create policy to allow only admins to manage important dates
CREATE POLICY "Admins can manage important dates" ON public.important_dates
  FOR ALL USING (public.is_admin());
