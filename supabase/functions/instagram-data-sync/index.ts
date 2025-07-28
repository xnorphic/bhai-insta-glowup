import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StarAPIResponse {
  data: {
    user: {
      id: string;
      username: string;
      full_name: string;
      biography: string;
      profile_pic_url: string;
      follower_count: number;
      following_count: number;
      media_count: number;
      is_business_account: boolean;
    };
    media: Array<{
      id: string;
      media_type: string;
      media_url: string;
      thumbnail_url: string;
      permalink: string;
      caption: string;
      timestamp: string;
      like_count: number;
      comments_count: number;
      shares_count?: number;
      play_count?: number;
      reach?: number;
      impressions?: number;
      saves?: number;
      hashtags?: string[];
      mentions?: string[];
    }>;
  };
}

interface SyncLog {
  id: string;
  profile_id: string;
  sync_type: 'profile' | 'content' | 'full';
  status: 'running' | 'completed' | 'failed';
  records_processed: number;
  records_updated: number;
  records_created: number;
  api_calls_made: number;
  error_message?: string;
}

async function fetchFromStarAPI(endpoint: string, profileId: string): Promise<any> {
  const apiKey = Deno.env.get('STARAPI_KEY');
  if (!apiKey) {
    throw new Error('STARAPI_KEY not configured');
  }

  const response = await fetch(`https://api.starapi.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: profileId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`StarAPI error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function createSyncLog(
  supabase: any, 
  profileId: string, 
  syncType: 'profile' | 'content' | 'full'
): Promise<string> {
  const { data, error } = await supabase
    .from('instagram_sync_logs')
    .insert({
      profile_id: profileId,
      sync_type: syncType,
      status: 'running'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating sync log:', error);
    throw error;
  }

  return data.id;
}

async function updateSyncLog(
  supabase: any, 
  logId: string, 
  updates: Partial<SyncLog>
): Promise<void> {
  const { error } = await supabase
    .from('instagram_sync_logs')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : undefined
    })
    .eq('id', logId);

  if (error) {
    console.error('Error updating sync log:', error);
  }
}

async function syncProfileData(supabase: any, profileId: string, logId: string) {
  console.log(`Syncing profile data for ${profileId}`);
  
  try {
    // Fetch basic profile info
    const profileData = await fetchFromStarAPI('user/info', profileId);
    await supabase.rpc('increment_api_calls', { profile_username: profileId });

    // Update instagram_connections table
    const { error: updateError } = await supabase
      .from('instagram_connections')
      .update({
        follower_count: profileData.data.user.follower_count,
        following_count: profileData.data.user.following_count,
        media_count: profileData.data.user.media_count,
        is_business_account: profileData.data.user.is_business_account,
        profile_picture_url: profileData.data.user.profile_pic_url,
        last_sync_at: new Date().toISOString()
      })
      .eq('username', profileId);

    if (updateError) {
      throw updateError;
    }

    await updateSyncLog(supabase, logId, {
      records_updated: 1,
      api_calls_made: 1
    });

    console.log(`Profile sync completed for ${profileId}`);
    return { success: true, updated: 1 };

  } catch (error) {
    console.error(`Profile sync failed for ${profileId}:`, error);
    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: error.message
    });
    throw error;
  }
}

async function syncContentData(supabase: any, profileId: string, logId: string) {
  console.log(`Syncing content data for ${profileId}`);
  
  try {
    // Fetch media data
    const mediaData = await fetchFromStarAPI('user/media', profileId);
    await supabase.rpc('increment_api_calls', { profile_username: profileId });

    if (!mediaData.data?.media || !Array.isArray(mediaData.data.media)) {
      console.log(`No media data found for ${profileId}`);
      return { success: true, created: 0, updated: 0 };
    }

    let created = 0;
    let updated = 0;
    let apiCalls = 1;

    // Process each media item
    for (const media of mediaData.data.media) {
      try {
        // Calculate engagement rate
        const totalEngagement = (media.like_count || 0) + (media.comments_count || 0) + (media.shares_count || 0);
        const engagementRate = media.reach ? ((totalEngagement / media.reach) * 100) : null;

        // Extract hashtags and mentions from caption
        const hashtags = media.caption?.match(/#[\w]+/g) || [];
        const mentions = media.caption?.match(/@[\w.]+/g) || [];

        const contentData = {
          instagram_media_id: media.id,
          tracked_profile_id: profileId,
          content_type: media.media_type === 'VIDEO' ? 'reel' : 'post',
          post_type: media.media_type,
          post_date: new Date(media.timestamp).toISOString(),
          caption: media.caption,
          thumbnail_url: media.thumbnail_url || media.media_url,
          content_link: media.permalink,
          total_likes: media.like_count || 0,
          total_comments: media.comments_count || 0,
          total_shares: media.shares_count || 0,
          total_views: media.play_count || 0,
          reach: media.reach || 0,
          impressions: media.impressions || 0,
          saves: media.saves || 0,
          video_plays: media.play_count || 0,
          engagement_rate: engagementRate,
          hashtags: hashtags,
          mentions: mentions,
          last_refreshed_at: new Date().toISOString(),
          sync_status: 'completed'
        };

        // Try to update existing record first
        const { data: existingData, error: selectError } = await supabase
          .from('instagram_content')
          .select('id')
          .eq('instagram_media_id', media.id)
          .eq('tracked_profile_id', profileId)
          .single();

        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('instagram_content')
            .update(contentData)
            .eq('id', existingData.id);

          if (updateError) {
            console.error(`Error updating media ${media.id}:`, updateError);
          } else {
            updated++;
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('instagram_content')
            .insert(contentData);

          if (insertError) {
            console.error(`Error inserting media ${media.id}:`, insertError);
          } else {
            created++;
          }
        }
      } catch (mediaError) {
        console.error(`Error processing media ${media.id}:`, mediaError);
      }
    }

    await updateSyncLog(supabase, logId, {
      records_processed: mediaData.data.media.length,
      records_created: created,
      records_updated: updated,
      api_calls_made: apiCalls
    });

    console.log(`Content sync completed for ${profileId}: ${created} created, ${updated} updated`);
    return { success: true, created, updated };

  } catch (error) {
    console.error(`Content sync failed for ${profileId}:`, error);
    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: error.message
    });
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, profile_id, sync_type } = await req.json();

    if (!action || !profile_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: action, profile_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log
    const logId = await createSyncLog(supabase, profile_id, sync_type || 'full');

    let result = { success: true, profile_updated: false, content_stats: { created: 0, updated: 0 } };

    try {
      switch (action) {
        case 'profile':
        case 'sync_profile':
          const profileResult = await syncProfileData(supabase, profile_id, logId);
          result.profile_updated = profileResult.success;
          break;

        case 'content':
        case 'sync_content':
          const contentResult = await syncContentData(supabase, profile_id, logId);
          result.content_stats = { created: contentResult.created, updated: contentResult.updated };
          break;

        case 'full':
        case 'sync_full':
          const profileFullResult = await syncProfileData(supabase, profile_id, logId);
          const contentFullResult = await syncContentData(supabase, profile_id, logId);
          result.profile_updated = profileFullResult.success;
          result.content_stats = { created: contentFullResult.created, updated: contentFullResult.updated };
          break;

        default:
          throw new Error(`Invalid action: ${action}`);
      }

      // Mark sync as completed
      await updateSyncLog(supabase, logId, { status: 'completed' });

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError) {
      await updateSyncLog(supabase, logId, {
        status: 'failed',
        error_message: syncError.message
      });
      throw syncError;
    }

  } catch (error) {
    console.error('Instagram sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});