-- Update the transform_csv_to_instagram_media function to handle multi-profile uploads
CREATE OR REPLACE FUNCTION public.transform_csv_to_instagram_media(import_id_param uuid, profile_id_param text DEFAULT NULL)
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
  current_profile_id text;
BEGIN
  -- Process each staging record
  FOR staging_record IN 
    SELECT * FROM public.instagram_csv_staging 
    WHERE import_id = import_id_param AND NOT processed
  LOOP
    BEGIN
      -- Determine profile_id for this record
      current_profile_id := profile_id_param;
      
      -- For multi-profile uploads, use the target_profile_id from the row data
      IF profile_id_param IS NULL AND staging_record.raw_data ? 'target_profile_id' THEN
        current_profile_id := staging_record.raw_data->>'target_profile_id';
      END IF;
      
      -- Skip if no profile_id could be determined
      IF current_profile_id IS NULL THEN
        error_details := jsonb_build_object(
          'row_number', staging_record.row_number,
          'error', 'No profile_id could be determined for this row',
          'data', staging_record.raw_data
        );
        
        result := jsonb_set(result, '{errors}', (result->'errors') || error_details);
        result := jsonb_set(result, '{failed}', ((result->>'failed')::int + 1)::text::jsonb);
        result := jsonb_set(result, '{processed}', ((result->>'processed')::int + 1)::text::jsonb);

        -- Update staging record with error
        UPDATE public.instagram_csv_staging 
        SET processed = true, processing_errors = array_append(processing_errors, error_details)
        WHERE id = staging_record.id;
        
        CONTINUE;
      END IF;

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
        'profile_id', current_profile_id,
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
        'created_at', now(),
        -- Enhanced collaboration fields
        'og_username', staging_record.raw_data->>'og_username',
        'collab_with', staging_record.raw_data->>'collab_with',
        -- Audio insights
        'audio_title', staging_record.raw_data->>'audio_title',
        'audio_artist', staging_record.raw_data->>'audio_artist',
        'play_count', COALESCE((replace(staging_record.raw_data->>'play_count', ',', ''))::integer, 0),
        'reshare_count', COALESCE((replace(staging_record.raw_data->>'reshare_count', ',', ''))::integer, 0),
        'is_trending_in_clips', CASE 
          WHEN lower(staging_record.raw_data->>'is_trending_in_clips') = 'true' THEN true
          ELSE false
        END,
        'is_paid_partnership', CASE 
          WHEN lower(staging_record.raw_data->>'is_paid_partnership') = 'true' THEN true
          ELSE false
        END,
        'location_name', staging_record.raw_data->>'location_name'
      );

      -- Insert into instagram_media
      INSERT INTO public.instagram_media (
        media_id, profile_id, media_type, media_url, thumbnail_url, permalink,
        caption, timestamp, like_count, comment_count, share_count, view_count,
        save_count, engagement_rate, hashtags, mentions, last_updated, created_at,
        reach, impressions, follower_count, og_username, collab_with,
        audio_title, audio_artist, play_count, reshare_count, 
        is_trending_in_clips, is_paid_partnership, location_name
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
        (media_record->>'reach')::integer,
        (media_record->>'impressions')::integer,
        (media_record->>'follower_count')::integer,
        media_record->>'og_username',
        media_record->>'collab_with',
        media_record->>'audio_title',
        media_record->>'audio_artist',
        (media_record->>'play_count')::integer,
        (media_record->>'reshare_count')::integer,
        (media_record->>'is_trending_in_clips')::boolean,
        (media_record->>'is_paid_partnership')::boolean,
        media_record->>'location_name'
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
        reach = EXCLUDED.reach,
        impressions = EXCLUDED.impressions,
        follower_count = EXCLUDED.follower_count,
        og_username = EXCLUDED.og_username,
        collab_with = EXCLUDED.collab_with,
        audio_title = EXCLUDED.audio_title,
        audio_artist = EXCLUDED.audio_artist,
        play_count = EXCLUDED.play_count,
        reshare_count = EXCLUDED.reshare_count,
        is_trending_in_clips = EXCLUDED.is_trending_in_clips,
        is_paid_partnership = EXCLUDED.is_paid_partnership,
        location_name = EXCLUDED.location_name,
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