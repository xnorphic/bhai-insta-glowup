-- Update the transform_csv_to_instagram_media function to handle the new CSV structure
CREATE OR REPLACE FUNCTION public.transform_csv_to_instagram_media(import_id_param uuid, profile_id_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result jsonb := '{"processed": 0, "successful": 0, "failed": 0, "errors": []}'::jsonb;
  staging_record record;
  media_record jsonb;
  error_details jsonb;
  media_id_generated text;
  parsed_date timestamp with time zone;
  engagement_rate_decimal numeric;
BEGIN
  -- Process each staging record
  FOR staging_record IN 
    SELECT * FROM public.instagram_csv_staging 
    WHERE import_id = import_id_param AND NOT processed
  LOOP
    BEGIN
      -- Generate media_id from post_url
      media_id_generated := CASE 
        WHEN staging_record.raw_data->>'post_url' IS NOT NULL THEN
          regexp_replace(staging_record.raw_data->>'post_url', '.*instagram\.com/p/([^/]+).*', '\1')
        ELSE 
          gen_random_uuid()::text
      END;

      -- Parse date - handle both YYYY-MM-DD and ISO formats
      parsed_date := CASE 
        WHEN staging_record.raw_data->>'post_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN
          (staging_record.raw_data->>'post_date')::date::timestamp with time zone
        ELSE
          (staging_record.raw_data->>'post_date')::timestamp with time zone
      END;

      -- Parse engagement rate (remove % and convert to decimal)
      engagement_rate_decimal := CASE 
        WHEN staging_record.raw_data->>'engagement_rate' IS NOT NULL AND staging_record.raw_data->>'engagement_rate' != '' THEN
          (replace(staging_record.raw_data->>'engagement_rate', '%', ''))::numeric / 100
        ELSE
          NULL
      END;

      -- Transform raw data to instagram_media format
      media_record := jsonb_build_object(
        'media_id', media_id_generated,
        'profile_id', profile_id_param,
        'media_type', CASE 
          WHEN lower(staging_record.raw_data->>'post_type') = 'reel' THEN 'VIDEO'
          WHEN lower(staging_record.raw_data->>'post_type') = 'video' THEN 'VIDEO'
          WHEN lower(staging_record.raw_data->>'post_type') = 'carousel' THEN 'CAROUSEL_ALBUM'
          ELSE 'IMAGE'
        END,
        'media_url', '', -- Not available in CSV, will be empty
        'thumbnail_url', '', -- Not available in CSV, will be empty
        'permalink', COALESCE(staging_record.raw_data->>'post_url', ''),
        'caption', COALESCE(staging_record.raw_data->>'caption', ''),
        'timestamp', parsed_date,
        'like_count', COALESCE((replace(staging_record.raw_data->>'likes', ',', ''))::integer, 0),
        'comment_count', COALESCE((replace(staging_record.raw_data->>'comments', ',', ''))::integer, 0),
        'share_count', COALESCE((replace(staging_record.raw_data->>'shares', ',', ''))::integer, 0),
        'view_count', COALESCE((replace(staging_record.raw_data->>'views', ',', ''))::integer, 0),
        'save_count', COALESCE((replace(staging_record.raw_data->>'saves', ',', ''))::integer, 0),
        'engagement_rate', engagement_rate_decimal,
        'hashtags', CASE 
          WHEN staging_record.raw_data->>'tags' IS NOT NULL AND staging_record.raw_data->>'tags' != ''
          THEN string_to_array(staging_record.raw_data->>'tags', ',')
          ELSE NULL 
        END,
        'mentions', NULL, -- Extract from caption if needed
        'reach', COALESCE((replace(staging_record.raw_data->>'reach', ',', ''))::integer, 0),
        'impressions', COALESCE((replace(staging_record.raw_data->>'impressions', ',', ''))::integer, 0),
        'follower_count', COALESCE((replace(staging_record.raw_data->>'follower_count', ',', ''))::integer, 0),
        'last_updated', now(),
        'created_at', now()
      );

      -- Insert into instagram_media
      INSERT INTO public.instagram_media (
        media_id, profile_id, media_type, media_url, thumbnail_url, permalink,
        caption, timestamp, like_count, comment_count, share_count, view_count,
        save_count, engagement_rate, hashtags, mentions, last_updated, created_at,
        -- Custom fields from CSV
        follower_count
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
        (media_record->>'created_at')::timestamp with time zone,
        (media_record->>'follower_count')::integer
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
        follower_count = EXCLUDED.follower_count,
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
$function$;