import { supabase } from "@/integrations/supabase/client";

export const triggerManualSync = async () => {
  try {
    console.log('Triggering manual sync...');
    
    const { data, error } = await supabase.functions.invoke('instagram-cron-sync', {
      body: { sync_type: 'full' }
    });

    if (error) throw error;
    
    console.log('Manual sync completed:', data);
    return data;
  } catch (error) {
    console.error('Manual sync failed:', error);
    throw error;
  }
};