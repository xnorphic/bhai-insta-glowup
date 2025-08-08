-- Create staging table for CSV imports
CREATE TABLE public.instagram_csv_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  filename text NOT NULL,
  file_size integer NOT NULL,
  total_rows integer NOT NULL,
  processed_rows integer NOT NULL DEFAULT 0,
  successful_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  validation_errors jsonb DEFAULT '[]'::jsonb,
  processing_errors jsonb DEFAULT '[]'::jsonb,
  field_mapping jsonb NOT NULL,
  import_settings jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_csv_imports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own CSV imports" 
ON public.instagram_csv_imports 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all CSV imports" 
ON public.instagram_csv_imports 
FOR ALL 
USING (is_admin());

-- Create staging table for raw CSV data
CREATE TABLE public.instagram_csv_staging (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id uuid NOT NULL REFERENCES public.instagram_csv_imports(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processing_errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_csv_staging ENABLE ROW LEVEL SECURITY;

-- Create policies for staging table
CREATE POLICY "Users can access staging data for their imports" 
ON public.instagram_csv_staging 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.instagram_csv_imports 
  WHERE id = import_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can access all staging data" 
ON public.instagram_csv_staging 
FOR ALL 
USING (is_admin());

-- Create function to validate and transform CSV data
CREATE OR REPLACE FUNCTION public.transform_csv_to_instagram_media(
  import_id_param uuid,
  profile_id_param text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb := '{"processed": 0, "successful": 0, "failed": 0, "errors": []}'::jsonb;
  staging_record record;
  media_record jsonb;
  error_details jsonb;
BEGIN
  -- Process each staging record
  FOR staging_record IN 
    SELECT * FROM public.instagram_csv_staging 
    WHERE import_id = import_id_param AND NOT processed
  LOOP
    BEGIN
      -- Transform raw data to instagram_media format
      media_record := jsonb_build_object(
        'media_id', staging_record.raw_data->>'media_id',
        'profile_id', profile_id_param,
        'media_type', COALESCE(staging_record.raw_data->>'media_type', 'unknown'),
        'media_url', staging_record.raw_data->>'media_url',
        'thumbnail_url', staging_record.raw_data->>'thumbnail_url',
        'permalink', staging_record.raw_data->>'permalink',
        'caption', staging_record.raw_data->>'caption',
        'timestamp', (staging_record.raw_data->>'timestamp')::timestamp with time zone,
        'like_count', COALESCE((staging_record.raw_data->>'like_count')::integer, 0),
        'comment_count', COALESCE((staging_record.raw_data->>'comment_count')::integer, 0),
        'share_count', COALESCE((staging_record.raw_data->>'share_count')::integer, 0),
        'view_count', COALESCE((staging_record.raw_data->>'view_count')::integer, 0),
        'save_count', COALESCE((staging_record.raw_data->>'save_count')::integer, 0),
        'engagement_rate', COALESCE((staging_record.raw_data->>'engagement_rate')::numeric, 0),
        'hashtags', CASE 
          WHEN staging_record.raw_data->>'hashtags' IS NOT NULL 
          THEN string_to_array(staging_record.raw_data->>'hashtags', ',')
          ELSE NULL 
        END,
        'mentions', CASE 
          WHEN staging_record.raw_data->>'mentions' IS NOT NULL 
          THEN string_to_array(staging_record.raw_data->>'mentions', ',')
          ELSE NULL 
        END,
        'last_updated', now(),
        'created_at', now()
      );

      -- Insert into instagram_media
      INSERT INTO public.instagram_media (
        media_id, profile_id, media_type, media_url, thumbnail_url, permalink,
        caption, timestamp, like_count, comment_count, share_count, view_count,
        save_count, engagement_rate, hashtags, mentions, last_updated, created_at
      ) VALUES (
        media_record->>'media_id',
        media_record->>'profile_id',
        media_record->>'media_type',
        media_record->>'media_url',
        media_record->>'thumbnail_url',
        media_record->>'permalink',
        media_record->>'caption',
        (media_record->>'timestamp')::timestamp with time zone,
        (media_record->>'like_count')::integer,
        (media_record->>'comment_count')::integer,
        (media_record->>'share_count')::integer,
        (media_record->>'view_count')::integer,
        (media_record->>'save_count')::integer,
        (media_record->>'engagement_rate')::numeric,
        CASE 
          WHEN media_record->'hashtags' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(media_record->'hashtags'))
          ELSE NULL 
        END,
        CASE 
          WHEN media_record->'mentions' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(media_record->'mentions'))
          ELSE NULL 
        END,
        (media_record->>'last_updated')::timestamp with time zone,
        (media_record->>'created_at')::timestamp with time zone
      )
      ON CONFLICT (media_id, profile_id) DO UPDATE SET
        media_type = EXCLUDED.media_type,
        media_url = EXCLUDED.media_url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        permalink = EXCLUDED.permalink,
        caption = EXCLUDED.caption,
        timestamp = EXCLUDED.timestamp,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        share_count = EXCLUDED.share_count,
        view_count = EXCLUDED.view_count,
        save_count = EXCLUDED.save_count,
        engagement_rate = EXCLUDED.engagement_rate,
        hashtags = EXCLUDED.hashtags,
        mentions = EXCLUDED.mentions,
        last_updated = EXCLUDED.last_updated;

      -- Mark as processed
      UPDATE public.instagram_csv_staging 
      SET processed = true 
      WHERE id = staging_record.id;

      -- Update counters
      result := jsonb_set(result, '{processed}', ((result->>'processed')::int + 1)::text::jsonb);
      result := jsonb_set(result, '{successful}', ((result->>'successful')::int + 1)::text::jsonb);

    EXCEPTION WHEN OTHERS THEN
      -- Log error
      error_details := jsonb_build_object(
        'row_number', staging_record.row_number,
        'error', SQLERRM,
        'data', staging_record.raw_data
      );
      
      result := jsonb_set(result, '{errors}', (result->'errors') || error_details);
      result := jsonb_set(result, '{failed}', ((result->>'failed')::int + 1)::text::jsonb);
      result := jsonb_set(result, '{processed}', ((result->>'processed')::int + 1)::text::jsonb);

      -- Update staging record with error
      UPDATE public.instagram_csv_staging 
      SET processed = true, processing_errors = array_append(processing_errors, error_details)
      WHERE id = staging_record.id;
    END;
  END LOOP;

  RETURN result;
END;
$$;