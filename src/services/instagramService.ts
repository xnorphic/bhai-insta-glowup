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
  collaborationType?: string;
  viralStatus?: string;
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
  // Enhanced collaboration insights
  collaborationStats: {
    originalContent: number;
    collaborations: number;
    userGenerated: number;
    paidPartnerships: number;
  };
  // Viral content insights
  viralStats: {
    trendingClips: number;
    viralContent: number;
    totalReshares: number;
    avgPlayCount: number;
  };
  // Audio insights
  topAudioTracks: Array<{
    title: string;
    artist: string;
    usageCount: number;
    avgEngagement: number;
  }>;
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

    if (filters.collaborationType) {
      switch (filters.collaborationType) {
        case 'original':
          mediaQuery = mediaQuery.is('og_username', null).is('collab_with', null);
          break;
        case 'collaboration':
          mediaQuery = mediaQuery.not('collab_with', 'is', null);
          break;
        case 'user_generated':
          mediaQuery = mediaQuery.not('og_username', 'is', null);
          break;
        case 'paid_partnership':
          mediaQuery = mediaQuery.eq('is_paid_partnership', true);
          break;
      }
    }

    if (filters.viralStatus) {
      switch (filters.viralStatus) {
        case 'trending':
          mediaQuery = mediaQuery.eq('is_trending_in_clips', true);
          break;
        case 'viral':
          mediaQuery = mediaQuery.gt('reshare_count', 50);
          break;
        case 'standard':
          mediaQuery = mediaQuery.or('reshare_count.lte.50,reshare_count.is.null');
          break;
      }
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
        collaborationStats: {
          originalContent: 0,
          collaborations: 0,
          userGenerated: 0,
          paidPartnerships: 0,
        },
        viralStats: {
          trendingClips: 0,
          viralContent: 0,
          totalReshares: 0,
          avgPlayCount: 0,
        },
        topAudioTracks: [],
      };
    }

    const totalLikes = content.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = content.reduce((sum, post) => sum + (post.comment_count || 0), 0);
    const totalViews = content.reduce((sum, post) => sum + (post.view_count || 0), 0) + 
                       stories.reduce((sum, story) => sum + (story.view_count || 0), 0);
    const totalShares = content.reduce((sum, post) => sum + (post.share_count || 0), 0);
    const totalReshares = content.reduce((sum, post) => sum + (post.reshare_count || 0), 0);

    const topPerformingPost = content.length > 0 ? content.reduce((best, current) => {
      const currentEngagement = (current.like_count || 0) + (current.comment_count || 0) + (current.share_count || 0);
      const bestEngagement = best ? (best.like_count || 0) + (best.comment_count || 0) + (best.share_count || 0) : 0;
      return currentEngagement > bestEngagement ? current : best;
    }, content[0]) : null;

    // Calculate collaboration stats
    const collaborationStats = {
      originalContent: content.filter(post => !post.og_username && !post.collab_with).length,
      collaborations: content.filter(post => post.collab_with).length,
      userGenerated: content.filter(post => post.og_username && post.og_username !== post.username).length,
      paidPartnerships: content.filter(post => post.is_paid_partnership).length,
    };

    // Calculate viral stats
    const trendingClips = content.filter(post => post.is_trending_in_clips).length;
    const viralContent = content.filter(post => (post.reshare_count || 0) > 50).length; // Threshold for viral
    const totalPlayCount = content.reduce((sum, post) => sum + (post.play_count || 0), 0);
    const avgPlayCount = content.length > 0 ? Math.round(totalPlayCount / content.length) : 0;

    // Calculate top audio tracks
    const audioTrackMap = new Map<string, { count: number; engagement: number; artist: string }>();
    content.forEach(post => {
      if (post.audio_title && post.audio_artist) {
        const key = `${post.audio_title} - ${post.audio_artist}`;
        const engagement = (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0);
        
        if (audioTrackMap.has(key)) {
          const existing = audioTrackMap.get(key)!;
          audioTrackMap.set(key, {
            count: existing.count + 1,
            engagement: existing.engagement + engagement,
            artist: post.audio_artist
          });
        } else {
          audioTrackMap.set(key, {
            count: 1,
            engagement,
            artist: post.audio_artist
          });
        }
      }
    });

    const topAudioTracks = Array.from(audioTrackMap.entries())
      .map(([title, data]) => ({
        title: title.split(' - ')[0],
        artist: data.artist,
        usageCount: data.count,
        avgEngagement: Math.round(data.engagement / data.count)
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

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
      collaborationStats,
      viralStats: {
        trendingClips,
        viralContent,
        totalReshares,
        avgPlayCount,
      },
      topAudioTracks,
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

    if (filters.collaborationType) {
      switch (filters.collaborationType) {
        case 'original':
          query = query.is('og_username', null).is('collab_with', null);
          break;
        case 'collaboration':
          query = query.not('collab_with', 'is', null);
          break;
        case 'user_generated':
          query = query.not('og_username', 'is', null);
          break;
        case 'paid_partnership':
          query = query.eq('is_paid_partnership', true);
          break;
      }
    }

    if (filters.viralStatus) {
      switch (filters.viralStatus) {
        case 'trending':
          query = query.eq('is_trending_in_clips', true);
          break;
        case 'viral':
          query = query.gt('reshare_count', 50);
          break;
        case 'standard':
          query = query.or('reshare_count.lte.50,reshare_count.is.null');
          break;
      }
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