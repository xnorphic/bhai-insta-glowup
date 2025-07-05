
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share } from "lucide-react";
import { instagramService, type AnalyticsFilters } from "@/services/instagramService";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";
import { ContentTable } from "@/components/analytics/ContentTable";
import { AnalyticsFilters as FiltersComponent } from "@/components/analytics/AnalyticsFilters";

export const InstagramAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // Mock available profiles for now - in real app, you'd fetch this from user's connected profiles
  const availableProfiles = ["naukridotcom", "example_profile"];

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', filters],
    queryFn: () => instagramService.getAnalyticsSummary(filters),
  });

  const { data: contentList, isLoading: contentLoading } = useQuery({
    queryKey: ['content-list', filters],
    queryFn: () => instagramService.getContentList(filters, 20),
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-by-type', filters],
    queryFn: () => instagramService.getPerformanceByType(filters),
  });

  const statsCards = [
    {
      title: "Total Posts",
      value: summary?.totalPosts?.toString() || "0",
      change: "+12%", // This would be calculated from previous period
      trend: "up" as const,
      icon: <Eye className="w-5 h-5" />
    },
    {
      title: "Total Likes",
      value: summary ? (summary.totalLikes >= 1000 ? `${(summary.totalLikes / 1000).toFixed(1)}K` : summary.totalLikes.toString()) : "0",
      change: "+8.5%",
      trend: "up" as const,
      icon: <Heart className="w-5 h-5" />
    },
    {
      title: "Total Comments",
      value: summary ? (summary.totalComments >= 1000 ? `${(summary.totalComments / 1000).toFixed(1)}K` : summary.totalComments.toString()) : "0",
      change: "+15.3%",
      trend: "up" as const,
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      title: "Avg. Engagement",
      value: summary ? `${summary.avgLikesPerPost + summary.avgCommentsPerPost}` : "0",
      change: "-2.1%",
      trend: "down" as const,
      icon: <Share className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#333333]">Instagram Analytics</h1>
      </div>

      {/* Filters */}
      <FiltersComponent 
        filters={filters}
        onFiltersChange={setFilters}
        availableProfiles={availableProfiles}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[hsl(240,70%,70%)]/10 rounded-lg">
                {stat.icon}
              </div>
              <div className={`flex items-center space-x-1 ${
                stat.trend === "up" ? "text-green-600" : "text-orange-500"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#333333]">
                {summaryLoading ? "..." : stat.value}
              </h3>
              <p className="text-[#666666] text-sm">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <PerformanceChart 
        data={performanceData || []} 
        isLoading={performanceLoading} 
      />

      {/* Top Performing Content Card */}
      {summary?.topPerformingPost && (
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-[#333333] mb-4">🏆 Top Performing Content</h3>
          <div className="flex items-start space-x-4">
            <img 
              src={summary.topPerformingPost.thumbnail_url} 
              alt="Top performing content"
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-[#333333] font-medium mb-2">
                {summary.topPerformingPost.caption || 'No caption available'}
              </p>
              <div className="flex space-x-4 text-sm text-[#666666]">
                <span>❤️ {summary.topPerformingPost.total_likes.toLocaleString()}</span>
                <span>💬 {summary.topPerformingPost.total_comments.toLocaleString()}</span>
                <span>👁️ {summary.topPerformingPost.total_views.toLocaleString()}</span>
              </div>
              {summary.topPerformingPost.ai_performance_summary && (
                <p className="text-sm text-[#666666] mt-2 italic">
                  AI Insight: {summary.topPerformingPost.ai_performance_summary}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content Table */}
      <ContentTable 
        content={contentList || []} 
        isLoading={contentLoading} 
      />

      {/* No Data State */}
      {!summaryLoading && (!summary || summary.totalPosts === 0) && (
        <Card className="p-12 bg-white rounded-2xl shadow-lg text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[hsl(240,70%,70%)]/10 rounded-full flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8 text-[hsl(240,70%,70%)]" />
            </div>
            <h3 className="text-xl font-semibold text-[#333333]">No Instagram Data Found</h3>
            <p className="text-[#666666] max-w-md mx-auto">
              Connect your Instagram profiles and start tracking your content performance. 
              Your analytics dashboard will appear here once data is available.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
