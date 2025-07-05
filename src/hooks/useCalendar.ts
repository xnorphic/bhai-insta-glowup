
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  event_date: string;
  platform: string;
  content_type: string;
  post_category: string;
  user_input_focus?: string;
  ai_generated_post_ideas: string;
  ai_generated_captions?: any;
  ai_generated_image_prompts?: string;
  ai_reasoning: string;
  is_saved: boolean;
  creation_timestamp: string;
}

export interface ImportantDate {
  id: string;
  date_month: string;
  name: string;
  occasion_type: string;
  region_notes?: string;
  is_fixed_date: boolean;
}

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('content_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchImportantDates = async () => {
    try {
      const { data, error } = await supabase
        .from('important_dates')
        .select('*')
        .order('date_month');
      
      if (error) throw error;
      setImportantDates(data || []);
    } catch (error) {
      console.error('Error fetching important dates:', error);
    }
  };

  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'creation_timestamp'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_calendar_events')
      .insert({
        ...eventData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const { error } = await supabase
      .from('content_calendar_events')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('content_calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchEvents();
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchImportantDates()]);
      setLoading(false);
    };

    initialize();
  }, [user]);

  return {
    events,
    importantDates,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
};
