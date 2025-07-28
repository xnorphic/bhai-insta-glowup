import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileConnection {
  profile_id: string;
  username: string;
  user_id: string;
  last_sync_at: string | null;
  is_active: boolean;
}

async function callSyncFunction(profileId: string, syncType: string) {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-enhanced-sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: `sync_${syncType}`,
      profile_id: profileId,
      sync_type: syncType
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync failed for ${profileId}: ${response.status} - ${errorText}`);
  }

  return await response.json();
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

    const { sync_type = 'full' } = await req.json().catch(() => ({ sync_type: 'full' }));

    console.log(`Starting scheduled Instagram sync - type: ${sync_type}`);

    // Get all active Instagram profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('instagram_profiles')
      .select('profile_id, username, user_id, last_sync_at, is_active')
      .eq('is_active', true);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No active Instagram profiles found for sync');
      return new Response(
        JSON.stringify({ 
          message: 'No active profiles to sync',
          profiles_processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} active profiles to sync`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process profiles in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (profile: ProfileConnection) => {
        let actualSyncType = sync_type;
        
        try {
          console.log(`Syncing profile: ${profile.username}`);
          
          // Determine sync strategy based on last sync time
          if (sync_type === 'auto') {
            const lastSync = profile.last_sync_at ? new Date(profile.last_sync_at) : null;
            const now = new Date();
            const hoursSinceLastSync = lastSync ? 
              (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60) : 
              999;

            // If no sync in last 24 hours, do full sync; otherwise just content
            actualSyncType = hoursSinceLastSync > 24 ? 'full' : 'content';
          } else {
            actualSyncType = sync_type;
          }

          const result = await callSyncFunction(profile.profile_id, actualSyncType);
          
          successCount++;
          return {
            profile_id: profile.profile_id,
            status: 'success',
            sync_type: actualSyncType,
            result: result
          };
          
        } catch (error) {
          console.error(`Failed to sync ${profile.username}:`, error);
          failureCount++;
          return {
            profile_id: profile.profile_id,
            status: 'failed',
            sync_type: actualSyncType,
            error: error.message
          };
        }
      });

      // Wait for current batch to complete before starting next
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to API limits
      if (i + batchSize < profiles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Log summary to sync logs table
    const summaryLogId = crypto.randomUUID();
    await supabase
      .from('instagram_sync_logs')
      .insert({
        id: summaryLogId,
        profile_id: 'SYSTEM_CRON',
        sync_type: sync_type,
        status: failureCount === 0 ? 'completed' : 'failed',
        records_processed: profiles.length,
        records_updated: successCount,
        records_created: 0,
        api_calls_made: successCount,
        error_message: failureCount > 0 ? `${failureCount} profiles failed to sync` : null,
        completed_at: new Date().toISOString()
      });

    console.log(`Cron sync completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Scheduled sync completed',
        profiles_processed: profiles.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cron sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Cron sync failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});