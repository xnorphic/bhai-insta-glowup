
-- Create storage bucket for brand book PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-books', 'brand-books', false);

-- Create storage policy for brand book uploads
CREATE POLICY "Users can upload brand books" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'brand-books' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for users to read their own brand books
CREATE POLICY "Users can read their own brand books" ON storage.objects
FOR SELECT USING (
  bucket_id = 'brand-books' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for users to delete their own brand books
CREATE POLICY "Users can delete their own brand books" ON storage.objects
FOR DELETE USING (
  bucket_id = 'brand-books' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the brand_books table to include extracted text and comprehensive AI analysis
ALTER TABLE public.brand_books 
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS what_we_do TEXT,
ADD COLUMN IF NOT EXISTS strategy_pillars TEXT,
ADD COLUMN IF NOT EXISTS brand_colors_fonts TEXT,
ADD COLUMN IF NOT EXISTS addressed_market TEXT,
ADD COLUMN IF NOT EXISTS aspiration_market TEXT,
ADD COLUMN IF NOT EXISTS content_ips TEXT,
ADD COLUMN IF NOT EXISTS tonality TEXT,
ADD COLUMN IF NOT EXISTS what_not_to_do TEXT,
ADD COLUMN IF NOT EXISTS customer_personas TEXT,
ADD COLUMN IF NOT EXISTS customer_strengths TEXT,
ADD COLUMN IF NOT EXISTS customer_weaknesses TEXT,
ADD COLUMN IF NOT EXISTS missing_information JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_analysis_complete BOOLEAN DEFAULT false;

-- Add index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_brand_books_user_upload ON brand_books(user_id, upload_timestamp DESC);
