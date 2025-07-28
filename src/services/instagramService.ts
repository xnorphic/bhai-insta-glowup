import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InstagramContent = Database['public']['Tables']['instagram_content']['Row'];
type ContentType = Database['public']['Enums']['content_type'];
type PerformanceCategory = Database['public']['Enums']['performance_category'];

export interface AnalyticsFilters {
  profileId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  contentType?: ContentType;
  performanceCategory?: PerformanceCategory;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  topPerformingPost: InstagramContent | null;
}

const calculatePerformanceCategory = (engagement: number, totalPosts: number): PerformanceCategory => {
  if (totalPosts === 0) return 'Red';
  
  const avgEngagement = engagement / totalPosts;
  if (avgEngagement > 1000) return 'Green';
  if (avgEngagement > 300) return 'Amber';
  return 'Red';
};

export const instagramService = {
  async getAnalyticsSummary(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
    let query = supabase
      .from('instagram_content')
      .select('*');

    // Apply filters
    if (filters.profileId) {
      query = query.eq('tracked_profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('post_date', filters.dateRange.start)
        .lte('post_date', filters.dateRange.end);
    }

    if (filters.contentType) {
      query = query.eq('content_type', filters.contentType);
    }

    if (filters.performanceCategory) {
      query = query.eq('performance_category', filters.performanceCategory);
    }

    const { data: content, error } = await query;

    if (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }

    if (!content || content.length === 0) {
      // Return empty analytics instead of mock data when no content exists
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

    const totalLikes = content.reduce((sum, post) => sum + post.total_likes, 0);
    const totalComments = content.reduce((sum, post) => sum + post.total_comments, 0);
    const totalViews = content.reduce((sum, post) => sum + post.total_views, 0);
    const totalShares = content.reduce((sum, post) => sum + post.total_shares, 0);

    const topPerformingPost = content.reduce((best, current) => {
      const currentEngagement = current.total_likes + current.total_comments + current.total_shares;
      const bestEngagement = best ? best.total_likes + best.total_comments + best.total_shares : 0;
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

  async getContentList(filters: AnalyticsFilters = {}, limit = 20): Promise<InstagramContent[]> {
    let query = supabase
      .from('instagram_content')
      .select('*')
      .order('post_date', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters.profileId) {
      query = query.eq('tracked_profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('post_date', filters.dateRange.start)
        .lte('post_date', filters.dateRange.end);
    }

    if (filters.contentType) {
      query = query.eq('content_type', filters.contentType);
    }

    if (filters.performanceCategory) {
      query = query.eq('performance_category', filters.performanceCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content list:', error);
      return [];
    }

    // Auto-calculate performance categories if missing
    const contentWithCategories = (data || []).map(item => {
      if (!item.performance_category) {
        const engagement = item.total_likes + item.total_comments + item.total_shares;
        const category = calculatePerformanceCategory(engagement, 1);
        
        // Update in background (don't await to avoid blocking)
        supabase
          .from('instagram_content')
          .update({ performance_category: category })
          .eq('id', item.id)
          .then();
        
        return { ...item, performance_category: category };
      }
      return item;
    });

    return contentWithCategories;
  },

  async getPerformanceByType(filters: AnalyticsFilters = {}) {
    let query = supabase
      .from('instagram_content')
      .select('content_type, total_likes, total_comments, total_views, total_shares');

    // Apply filters
    if (filters.profileId) {
      query = query.eq('tracked_profile_id', filters.profileId);
    }

    if (filters.dateRange) {
      query = query
        .gte('post_date', filters.dateRange.start)
        .lte('post_date', filters.dateRange.end);
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
      const type = item.content_type;
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
      acc[type].totalLikes += item.total_likes;
      acc[type].totalComments += item.total_comments;
      acc[type].totalViews += item.total_views;
      acc[type].totalShares += item.total_shares;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  },

};
