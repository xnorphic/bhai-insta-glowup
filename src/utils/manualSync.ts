import { supabase } from "@/integrations/supabase/client";

export const triggerManualSync = async () => {
  try {
    console.log('Triggering manual sync via scheduler...');
    
    const { data, error } = await supabase.functions.invoke('instagram-scheduler', {
      body: { force: true, sync_type: 'full' }
    });

    if (error) throw error;
    
    console.log('Manual sync completed:', data);
    return data;
  } catch (error) {
    console.error('Manual sync failed:', error);
    throw error;
  }
};