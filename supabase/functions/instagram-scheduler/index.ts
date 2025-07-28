import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface for profile connection
interface ProfileConnection {
  id: string;
  profile_id: string;
  username: string;
  user_id: string;
  last_sync_at: string | null;
  is_active: boolean;
}

// Helper function to call the Instagram enhanced sync function
async function callSyncFunction(profileId: string, syncType: string): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/instagram-enhanced-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      action: syncType === 'full' ? 'sync_full' : `sync_${syncType}`,
      profile_id: profileId,
      sync_type: syncType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync function call failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Determine sync type based on last sync time
function determineSyncType(lastSyncAt: string | null): string {
  if (!lastSyncAt) {
    return 'full'; // First time sync
  }

  const lastSync = new Date(lastSyncAt);
  const now = new Date();
  const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastSync > 24) {
    return 'full'; // Full sync if more than 24 hours
  } else if (hoursSinceLastSync > 12) {
    return 'media'; // Media and stories sync if more than 12 hours
  } else {
    return 'stories'; // Only stories for recent syncs
  }
}

// Check if it's sync time (8 AM or 8 PM IST)
function isSyncTime(): boolean {
  const now = new Date();
  
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  
  // Check if it's 8:00 AM or 8:00 PM IST (within 5 minute window)
  return (hour === 8 || hour === 20) && minute >= 0 && minute <= 5;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Instagram scheduler starting...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body (for manual triggers)
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch {
      // Empty body is fine for cron jobs
    }

    const { sync_type: forcedSyncType, force = false } = requestBody;

    // Check if it's sync time (unless forced)
    if (!force && !isSyncTime()) {
      console.log('Not sync time, skipping...');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Not sync time',
          next_sync: '8:00 AM or 8:00 PM IST',
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching active Instagram profiles...');
    
    // Fetch active Instagram profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('instagram_profiles')
      .select('id, profile_id, username, user_id, last_sync_at, is_active')
      .eq('is_active', true);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('No active profiles found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active profiles to sync',
          synced_profiles: 0,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${profiles.length} active profiles to sync`);

    // Process profiles in batches
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} with ${batch.length} profiles`);

      const batchPromises = batch.map(async (profile: ProfileConnection) => {
        try {
          // Determine sync type
          const syncType = forcedSyncType || determineSyncType(profile.last_sync_at);
          
          console.log(`Syncing profile ${profile.username} (${profile.profile_id}) with ${syncType} sync`);
          
          // Call sync function
          const syncResult = await callSyncFunction(profile.profile_id, syncType);
          
          // Log successful sync
          const { error: logError } = await supabase
            .from('instagram_sync_logs')
            .insert({
              profile_id: profile.profile_id,
              sync_type: syncType,
              status: 'completed',
              completed_at: new Date().toISOString(),
              records_processed: syncResult.results?.records_processed || 0,
              records_created: syncResult.results?.records_created || 0,
              records_updated: syncResult.results?.records_updated || 0,
              api_calls_made: syncResult.results?.api_calls_made || 0,
              sync_details: JSON.stringify(syncResult),
            });

          if (logError) {
            console.error(`Failed to log sync for ${profile.username}:`, logError);
          }

          return {
            profile_id: profile.profile_id,
            username: profile.username,
            sync_type: syncType,
            success: true,
            result: syncResult,
          };

        } catch (error) {
          console.error(`Sync failed for profile ${profile.username}:`, error);
          
          // Log failed sync
          const { error: logError } = await supabase
            .from('instagram_sync_logs')
            .insert({
              profile_id: profile.profile_id,
              sync_type: forcedSyncType || 'auto',
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message,
              sync_details: JSON.stringify({ error: error.message }),
            });

          if (logError) {
            console.error(`Failed to log error for ${profile.username}:`, logError);
          }

          return {
            profile_id: profile.profile_id,
            username: profile.username,
            sync_type: forcedSyncType || 'auto',
            success: false,
            error: error.message,
          };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch promise rejected:', result.reason);
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < profiles.length) {
        console.log('Waiting 10 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const successfulSyncs = results.filter(r => r.success).length;
    const failedSyncs = results.filter(r => !r.success).length;

    console.log(`Scheduler completed: ${successfulSyncs} successful, ${failedSyncs} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync operation completed',
        total_profiles: profiles.length,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        sync_time: new Date().toISOString(),
        results: results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Scheduler failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Scheduler operation failed',
        details: error.message,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});