import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface definitions for StarAPI responses
interface StarAPIProfileData {
  id: string;
  username: string;
  full_name?: string;
  biography?: string;
  profile_picture_url?: string;
  follower_count?: number;
  following_count?: number;
  media_count?: number;
  is_business_account?: boolean;
  is_verified?: boolean;
  account_type?: string;
  external_url?: string;
  category?: string;
}

interface StarAPIMediaData {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  save_count?: number;
  hashtags?: string[];
  mentions?: string[];
  location_id?: string;
  location_name?: string;
  video_duration?: number;
  children?: StarAPIMediaData[];
  insights?: any;
}

interface StarAPIStoryData {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  expires_at: string;
  view_count?: number;
  reply_count?: number;
  story_type?: string;
  highlight_id?: string;
  stickers?: any;
  mentions?: string[];
  hashtags?: string[];
  location_id?: string;
  location_name?: string;
}

// Sync log interface
interface SyncLog {
  profile_id: string;
  sync_type: 'profile' | 'media' | 'stories' | 'full';
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  api_calls_made: number;
  error_message?: string;
  sync_details?: any;
}

// Fetch data from StarAPI
async function fetchFromStarAPI(endpoint: string, profileId: string): Promise<any> {
  const starApiKey = Deno.env.get('STARAPI_KEY');
  if (!starApiKey) {
    throw new Error('STARAPI_KEY environment variable is not set');
  }

  const url = `https://api.starapi.co/api/v1/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': starApiKey,
    },
    body: JSON.stringify({ username: profileId }),
  });

  console.log(`StarAPI ${endpoint} response status:`, response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`StarAPI ${endpoint} fetch failed:`, response.status, errorText);
    throw new Error(`StarAPI request failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Create sync log entry
async function createSyncLog(
  supabase: any,
  profileId: string,
  syncType: 'profile' | 'media' | 'stories' | 'full'
): Promise<string> {
  const { data, error } = await supabase
    .from('instagram_sync_logs')
    .insert({
      profile_id: profileId,
      sync_type: syncType,
      status: 'running',
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      api_calls_made: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create sync log:', error);
    throw error;
  }

  return data.id;
}

// Update sync log
async function updateSyncLog(
  supabase: any,
  logId: string,
  updates: Partial<SyncLog>
): Promise<void> {
  const { error } = await supabase
    .from('instagram_sync_logs')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : undefined,
    })
    .eq('id', logId);

  if (error) {
    console.error('Failed to update sync log:', error);
  }
}

// Sync profile data
async function syncProfileData(
  supabase: any,
  profileId: string,
  logId: string
): Promise<{ success: boolean; updated: number }> {
  try {
    console.log('Fetching profile data from StarAPI...');
    const profileData = await fetchFromStarAPI('instagram/user/info', profileId);

    if (!profileData || !profileData.data) {
      throw new Error('No profile data received from StarAPI');
    }

    const profile: StarAPIProfileData = profileData.data;

    // Upsert profile data
    const { error: upsertError } = await supabase
      .from('instagram_profiles')
      .upsert({
        profile_id: profileId,
        username: profile.username || profileId,
        full_name: profile.full_name,
        biography: profile.biography,
        profile_picture_url: profile.profile_picture_url,
        follower_count: profile.follower_count || 0,
        following_count: profile.following_count || 0,
        media_count: profile.media_count || 0,
        is_business_account: profile.is_business_account || false,
        is_verified: profile.is_verified || false,
        account_type: profile.account_type || 'personal',
        external_url: profile.external_url,
        category: profile.category,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id',
      });

    if (upsertError) {
      throw upsertError;
    }

    // Increment API calls
    await supabase.rpc('increment_api_calls', { target_profile_id: profileId });

    await updateSyncLog(supabase, logId, {
      records_processed: 1,
      records_updated: 1,
      api_calls_made: 1,
    });

    console.log(`Profile sync completed for ${profileId}`);
    return { success: true, updated: 1 };

  } catch (error) {
    console.error('Profile sync failed:', error);
    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: error.message,
    });
    return { success: false, updated: 0 };
  }
}

// Sync media data
async function syncMediaData(
  supabase: any,
  profileId: string,
  logId: string
): Promise<{ success: boolean; created: number; updated: number }> {
  try {
    console.log('Fetching media data from StarAPI...');
    const mediaData = await fetchFromStarAPI('instagram/user/posts', profileId);

    if (!mediaData || !mediaData.data || !Array.isArray(mediaData.data)) {
      throw new Error('No media data received from StarAPI');
    }

    const mediaItems: StarAPIMediaData[] = mediaData.data;
    let created = 0;
    let updated = 0;
    let apiCalls = 1; // Initial API call for posts

    for (const media of mediaItems) {
      try {
        // Calculate engagement rate
        const totalEngagement = (media.like_count || 0) + (media.comment_count || 0) + (media.share_count || 0);
        const engagementRate = media.view_count ? (totalEngagement / media.view_count) * 100 : 0;

        // Prepare media data
        const mediaRecord = {
          media_id: media.id,
          profile_id: profileId,
          media_type: media.media_type,
          media_url: media.media_url,
          thumbnail_url: media.thumbnail_url,
          permalink: media.permalink,
          caption: media.caption,
          timestamp: media.timestamp,
          like_count: media.like_count || 0,
          comment_count: media.comment_count || 0,
          share_count: media.share_count || 0,
          view_count: media.view_count || 0,
          save_count: media.save_count || 0,
          engagement_rate: engagementRate,
          hashtags: media.hashtags || [],
          mentions: media.mentions || [],
          location_id: media.location_id,
          location_name: media.location_name,
          video_duration: media.video_duration,
          children_media: media.children ? JSON.stringify(media.children) : null,
          insights: media.insights ? JSON.stringify(media.insights) : null,
          last_updated: new Date().toISOString(),
        };

        // Upsert media record
        const { error: mediaError } = await supabase
          .from('instagram_media')
          .upsert(mediaRecord, {
            onConflict: 'media_id',
          });

        if (mediaError) {
          console.error(`Failed to upsert media ${media.id}:`, mediaError);
          continue;
        }

        // Check if it's a new record or update
        const { data: existingMedia } = await supabase
          .from('instagram_media')
          .select('id')
          .eq('media_id', media.id)
          .single();

        if (existingMedia) {
          updated++;
        } else {
          created++;
        }

      } catch (mediaError) {
        console.error(`Error processing media ${media.id}:`, mediaError);
        continue;
      }
    }

    // Increment API calls
    await supabase.rpc('increment_api_calls', { target_profile_id: profileId });

    await updateSyncLog(supabase, logId, {
      records_processed: mediaItems.length,
      records_created: created,
      records_updated: updated,
      api_calls_made: apiCalls,
    });

    console.log(`Media sync completed for ${profileId}: ${created} created, ${updated} updated`);
    return { success: true, created, updated };

  } catch (error) {
    console.error('Media sync failed:', error);
    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: error.message,
    });
    return { success: false, created: 0, updated: 0 };
  }
}

// Sync stories data
async function syncStoriesData(
  supabase: any,
  profileId: string,
  logId: string
): Promise<{ success: boolean; created: number; updated: number }> {
  try {
    console.log('Fetching stories data from StarAPI...');
    const storiesData = await fetchFromStarAPI('instagram/user/stories', profileId);

    if (!storiesData || !storiesData.data || !Array.isArray(storiesData.data)) {
      console.log('No stories data available');
      return { success: true, created: 0, updated: 0 };
    }

    const storyItems: StarAPIStoryData[] = storiesData.data;
    let created = 0;
    let updated = 0;
    let apiCalls = 1; // Initial API call for stories

    for (const story of storyItems) {
      try {
        // Prepare story data
        const storyRecord = {
          story_id: story.id,
          profile_id: profileId,
          media_type: story.media_type,
          media_url: story.media_url,
          thumbnail_url: story.thumbnail_url,
          timestamp: story.timestamp,
          expires_at: story.expires_at,
          view_count: story.view_count || 0,
          reply_count: story.reply_count || 0,
          story_type: story.story_type || 'STORY',
          highlight_id: story.highlight_id,
          stickers: story.stickers ? JSON.stringify(story.stickers) : null,
          mentions: story.mentions || [],
          hashtags: story.hashtags || [],
          location_id: story.location_id,
          location_name: story.location_name,
          is_archived: false,
          last_updated: new Date().toISOString(),
        };

        // Upsert story record
        const { error: storyError } = await supabase
          .from('instagram_stories')
          .upsert(storyRecord, {
            onConflict: 'story_id',
          });

        if (storyError) {
          console.error(`Failed to upsert story ${story.id}:`, storyError);
          continue;
        }

        // Check if it's a new record or update
        const { data: existingStory } = await supabase
          .from('instagram_stories')
          .select('id')
          .eq('story_id', story.id)
          .single();

        if (existingStory) {
          updated++;
        } else {
          created++;
        }

      } catch (storyError) {
        console.error(`Error processing story ${story.id}:`, storyError);
        continue;
      }
    }

    // Increment API calls
    await supabase.rpc('increment_api_calls', { target_profile_id: profileId });

    await updateSyncLog(supabase, logId, {
      records_processed: storyItems.length,
      records_created: created,
      records_updated: updated,
      api_calls_made: apiCalls,
    });

    console.log(`Stories sync completed for ${profileId}: ${created} created, ${updated} updated`);
    return { success: true, created, updated };

  } catch (error) {
    console.error('Stories sync failed:', error);
    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: error.message,
    });
    return { success: false, created: 0, updated: 0 };
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { action, profile_id, sync_type } = await req.json();

    if (!action || !profile_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: action, profile_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} for profile: ${profile_id}, sync_type: ${sync_type}`);

    let logId: string;
    let results: any = {};

    switch (action) {
      case 'sync_profile':
        logId = await createSyncLog(supabase, profile_id, 'profile');
        results = await syncProfileData(supabase, profile_id, logId);
        break;

      case 'sync_media':
        logId = await createSyncLog(supabase, profile_id, 'media');
        results = await syncMediaData(supabase, profile_id, logId);
        break;

      case 'sync_stories':
        logId = await createSyncLog(supabase, profile_id, 'stories');
        results = await syncStoriesData(supabase, profile_id, logId);
        break;

      case 'sync_full':
        logId = await createSyncLog(supabase, profile_id, 'full');
        
        // Sync profile first
        const profileResult = await syncProfileData(supabase, profile_id, logId);
        
        // Then sync media
        const mediaResult = await syncMediaData(supabase, profile_id, logId);
        
        // Finally sync stories
        const storiesResult = await syncStoriesData(supabase, profile_id, logId);

        results = {
          profile: profileResult,
          media: mediaResult,
          stories: storiesResult,
          overall_success: profileResult.success && mediaResult.success && storiesResult.success,
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update final sync log status
    await updateSyncLog(supabase, logId, {
      status: results.success || results.overall_success ? 'completed' : 'failed',
    });

    console.log(`Sync operation completed:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        profile_id,
        sync_type,
        results,
        log_id: logId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Sync operation failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Sync operation failed',
        details: error.message,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});