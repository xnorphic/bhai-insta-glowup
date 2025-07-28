import { supabase } from "@/integrations/supabase/client";

export interface InstagramProfile {
  username: string;
  displayName: string;
  type: 'owned' | 'competitor';
}

export const instagramDataLoader = {
  async loadProfileData(username: string) {
    console.log(`Loading data for ${username}...`);
    
    try {
      // Call the enhanced sync function to sync content
      const { data, error } = await supabase.functions.invoke('instagram-enhanced-sync', {
        body: {
          action: 'sync_full',
          profile_id: username,
          sync_type: 'full'
        }
      });

      if (error) {
        console.error(`Error syncing ${username}:`, error);
        throw error;
      }

      console.log(`Successfully synced content for ${username}`);
      return data;
    } catch (error) {
      console.error(`Failed to load data for ${username}:`, error);
      throw error;
    }
  },

  async loadMultipleProfiles(profiles: InstagramProfile[]) {
    const results = [];
    
    for (const profile of profiles) {
      try {
        console.log(`Loading ${profile.type} profile: ${profile.username}`);
        const result = await this.loadProfileData(profile.username);
        results.push({
          username: profile.username,
          displayName: profile.displayName,
          type: profile.type,
          success: true,
          data: result
        });
      } catch (error) {
        console.error(`Failed to load ${profile.username}:`, error);
        results.push({
          username: profile.username,
          displayName: profile.displayName,
          type: profile.type,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  },

  async getContentForDateRange(startDate: string, endDate: string, profileIds?: string[]) {
    let query = supabase
      .from('instagram_media')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (profileIds && profileIds.length > 0) {
      query = query.in('profile_id', profileIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content for date range:', error);
      throw error;
    }

    return data || [];
  }
};