import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InstagramMedia = Database['public']['Tables']['instagram_media']['Row'];
type InstagramStory = Database['public']['Tables']['instagram_stories']['Row'];

export interface AnalyticsFilters {
  profileId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  contentType?: string;
  performanceCategory?: string;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  totalStories: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  topPerformingPost: InstagramMedia | null;
}

const calculatePerformanceCategory = (engagement: number, totalPosts: number): string => {
  if (totalPosts === 0) return 'Red';
  
  const avgEngagement = engagement / totalPosts;
  if (avgEngagement > 1000) return 'Green';
  if (avgEngagement > 300) return 'Amber';
  return 'Red';
};

export const instagramService = {
  async getAnalyticsSummary(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
    // Fetch media data
    let mediaQuery = supabase
      .from('instagram_media')
      .select('*');

    if (filters.profileId) {
      mediaQuery = mediaQuery.eq('profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      mediaQuery = mediaQuery
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end);
    }

    if (filters.contentType) {
      mediaQuery = mediaQuery.eq('media_type', filters.contentType);
    }

    // Fetch stories data
    let storiesQuery = supabase
      .from('instagram_stories')
      .select('*');

    if (filters.profileId) {
      storiesQuery = storiesQuery.eq('profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      storiesQuery = storiesQuery
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end);
    }

    const [mediaResult, storiesResult] = await Promise.all([
      mediaQuery,
      storiesQuery
    ]);

    if (mediaResult.error) {
      console.error('Error fetching media analytics:', mediaResult.error);
      throw mediaResult.error;
    }

    if (storiesResult.error) {
      console.error('Error fetching stories analytics:', storiesResult.error);
      throw storiesResult.error;
    }

    const content = mediaResult.data || [];
    const stories = storiesResult.data || [];

    if (content.length === 0 && stories.length === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalViews: 0,
        totalShares: 0,
        totalStories: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        topPerformingPost: null,
      };
    }

    const totalLikes = content.reduce((sum, post) => sum + post.like_count, 0);
    const totalComments = content.reduce((sum, post) => sum + post.comment_count, 0);
    const totalViews = content.reduce((sum, post) => sum + post.view_count, 0) + 
                       stories.reduce((sum, story) => sum + story.view_count, 0);
    const totalShares = content.reduce((sum, post) => sum + post.share_count, 0);

    const topPerformingPost = content.length > 0 ? content.reduce((best, current) => {
      const currentEngagement = current.like_count + current.comment_count + current.share_count;
      const bestEngagement = best ? best.like_count + best.comment_count + best.share_count : 0;
      return currentEngagement > bestEngagement ? current : best;
    }, content[0]) : null;

    return {
      totalPosts: content.length,
      totalLikes,
      totalComments,
      totalViews,
      totalShares,
      totalStories: stories.length,
      avgLikesPerPost: content.length > 0 ? Math.round(totalLikes / content.length) : 0,
      avgCommentsPerPost: content.length > 0 ? Math.round(totalComments / content.length) : 0,
      topPerformingPost,
    };
  },

  async getContentList(filters: AnalyticsFilters = {}, limit = 20): Promise<InstagramMedia[]> {
    let query = supabase
      .from('instagram_media')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters.profileId) {
      query = query.eq('profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end);
    }

    if (filters.contentType) {
      query = query.eq('media_type', filters.contentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content list:', error);
      return [];
    }

    return data || [];
  },

  async getStoriesList(filters: AnalyticsFilters = {}, limit = 20): Promise<InstagramStory[]> {
    let query = supabase
      .from('instagram_stories')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters.profileId) {
      query = query.eq('profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stories list:', error);
      return [];
    }

    return data || [];
  },

  async getPerformanceByType(filters: AnalyticsFilters = {}) {
    let query = supabase
      .from('instagram_media')
      .select('media_type, like_count, comment_count, view_count, share_count');

    // Apply filters
    if (filters.profileId) {
      query = query.eq('profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching performance by type:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by content type and calculate totals
    const grouped = data.reduce((acc, item) => {
      const type = item.media_type;
      if (!acc[type]) {
        acc[type] = { 
          type, 
          count: 0, 
          totalLikes: 0, 
          totalComments: 0, 
          totalViews: 0, 
          totalShares: 0 
        };
      }
      acc[type].count++;
      acc[type].totalLikes += item.like_count;
      acc[type].totalComments += item.comment_count;
      acc[type].totalViews += item.view_count;
      acc[type].totalShares += item.share_count;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  },
};