
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
      // Return mock data for demo purposes
      return this.getMockAnalyticsSummary();
    }

    if (!content || content.length === 0) {
      // Return mock data for demo purposes when no real data exists
      return this.getMockAnalyticsSummary();
    }

    const totalLikes = content.reduce((sum, post) => sum + post.total_likes, 0);
    const totalComments = content.reduce((sum, post) => sum + post.total_comments, 0);
    const totalViews = content.reduce((sum, post) => sum + post.total_views, 0);
    const totalShares = content.reduce((sum, post) => sum + post.total_shares, 0);

    const topPerformingPost = content.reduce((best, current) => {
      const currentEngagement = current.total_likes + current.total_comments + current.total_shares;
      const bestEngagement = best.total_likes + best.total_comments + best.total_shares;
      return currentEngagement > bestEngagement ? current : best;
    });

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

    // Apply filters (same as above)
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
      return this.getMockContentList();
    }

    return data || this.getMockContentList();
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
      return this.getMockPerformanceData();
    }

    if (!data || data.length === 0) {
      return this.getMockPerformanceData();
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

  // Mock data methods for demo purposes
  getMockAnalyticsSummary(): AnalyticsSummary {
    return {
      totalPosts: 24,
      totalLikes: 15420,
      totalComments: 892,
      totalViews: 45230,
      totalShares: 234,
      avgLikesPerPost: 642,
      avgCommentsPerPost: 37,
      topPerformingPost: {
        id: 'mock-1',
        tracked_profile_id: 'demo_account',
        instagram_media_id: 'mock_media_1',
        content_link: 'https://instagram.com/p/mock1',
        content_type: 'post' as ContentType,
        caption: 'Amazing sunset view from our latest adventure! 🌅 #sunset #travel #photography',
        thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
        post_date: '2024-12-01T18:30:00Z',
        total_likes: 2840,
        total_comments: 156,
        total_views: 8920,
        total_shares: 45,
        performance_category: 'Green' as PerformanceCategory,
        ai_performance_summary: 'This post performed exceptionally well due to high-quality visual content and optimal posting time',
        ai_sentiment_summary: null,
        is_boosted: false,
        location_name: 'Santorini, Greece',
        location_id: null,
        audio_used: null,
        alt_text: 'Beautiful sunset over the ocean',
        last_refreshed_at: '2024-12-15T10:00:00Z',
        created_at: '2024-12-01T18:30:00Z'
      }
    };
  },

  getMockContentList(): InstagramContent[] {
    return [
      {
        id: 'mock-1',
        tracked_profile_id: 'demo_account',
        instagram_media_id: 'mock_media_1',
        content_link: 'https://instagram.com/p/mock1',
        content_type: 'post' as ContentType,
        caption: 'Amazing sunset view! 🌅',
        thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
        post_date: '2024-12-01T18:30:00Z',
        total_likes: 2840,
        total_comments: 156,
        total_views: 8920,
        total_shares: 45,
        performance_category: 'Green' as PerformanceCategory,
        ai_performance_summary: 'Excellent engagement',
        ai_sentiment_summary: null,
        is_boosted: false,
        location_name: 'Santorini, Greece',
        location_id: null,
        audio_used: null,
        alt_text: 'Beautiful sunset',
        last_refreshed_at: '2024-12-15T10:00:00Z',
        created_at: '2024-12-01T18:30:00Z'
      },
      {
        id: 'mock-2',
        tracked_profile_id: 'demo_account', 
        instagram_media_id: 'mock_media_2',
        content_link: 'https://instagram.com/p/mock2',
        content_type: 'reel' as ContentType,
        caption: 'Quick morning routine ☀️',
        thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        post_date: '2024-11-28T08:15:00Z',
        total_likes: 1920,
        total_comments: 89,
        total_views: 12400,  
        total_shares: 32,
        performance_category: 'Amber' as PerformanceCategory,
        ai_performance_summary: 'Good engagement for morning content',
        ai_sentiment_summary: null,
        is_boosted: false,
        location_name: null,
        location_id: null,
        audio_used: 'trending_audio_123', 
        alt_text: 'Morning routine video',
        last_refreshed_at: '2024-12-15T10:00:00Z',
        created_at: '2024-11-28T08:15:00Z'
      }
    ];
  },

  getMockPerformanceData() {
    return [
      { type: 'post', count: 12, totalLikes: 8920, totalComments: 456, totalViews: 25600, totalShares: 134 },
      { type: 'reel', count: 8, totalLikes: 5240, totalComments: 324, totalViews: 18200, totalShares: 89 },
      { type: 'carousel', count: 4, totalLikes: 1260, totalComments: 112, totalViews: 1430, totalShares: 11 }
    ];
  }
};
