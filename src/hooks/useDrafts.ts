import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Draft {
  id: string;
  user_id: string;
  content_data: {
    id: string;
    mainTheme: string;
    caption: string;
    imagePrompt: string;
    reasoning?: string;
    targetGroup?: string;
    intendedFeeling?: string;
    carouselSlides?: {
      slideNumber: number;
      imageGuideline: string;
      textGuideline: string;
    }[];
  };
  form_data: {
    platform: string;
    contentType: string;
    theme: string;
    tone: string;
    eventDate: Date | null;
  };
  status: 'draft' | 'approved' | 'rejected';
  created_at: string;
  created_by_username: string;
  approved_at?: string;
  approved_by?: string;
}

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDrafts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data as any || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  };

  const updateDraftStatus = async (draftId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('drafts')
        .update({ 
          status,
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', draftId);

      if (error) throw error;
      
      // Refresh drafts
      fetchDrafts();
      return true;
    } catch (error) {
      console.error('Error updating draft status:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [user]);

  return {
    drafts,
    loading,
    fetchDrafts,
    deleteDraft,
    updateDraftStatus
  };
};