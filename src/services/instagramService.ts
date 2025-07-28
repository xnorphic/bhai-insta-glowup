import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InstagramMedia = Database['public']['Tables']['instagram_media']['Row'];

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
    let query = supabase
      .from('instagram_media')
      .select('*');

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

    const { data: content, error } = await query;

    if (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }

    if (!content || content.length === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalViews: 0,
        totalShares: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        topPerformingPost: null,
      };
    }

    const totalLikes = content.reduce((sum, post) => sum + post.like_count, 0);
    const totalComments = content.reduce((sum, post) => sum + post.comment_count, 0);
    const totalViews = content.reduce((sum, post) => sum + post.view_count, 0);
    const totalShares = content.reduce((sum, post) => sum + post.share_count, 0);

    const topPerformingPost = content.reduce((best, current) => {
      const currentEngagement = current.like_count + current.comment_count + current.share_count;
      const bestEngagement = best ? best.like_count + best.comment_count + best.share_count : 0;
      return currentEngagement > bestEngagement ? current : best;
    }, content[0]);

    return {
      totalPosts: content.length,
      totalLikes,
      totalComments,
      totalViews,
      totalShares,
      avgLikesPerPost: Math.round(totalLikes / content.length),
      avgCommentsPerPost: Math.round(totalComments / content.length),
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