
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share } from "lucide-react";
import { instagramService, type AnalyticsFilters } from "@/services/instagramService";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";
import { ContentTable } from "@/components/analytics/ContentTable";
import { AnalyticsFilters as FiltersComponent } from "@/components/analytics/AnalyticsFilters";
import { DataLoader } from "@/components/instagram/DataLoader";

export const InstagramAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // Available profiles now include both owned and competitor profiles
  const availableProfiles = ["naukridotcom", "swiggyindia"];

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
      change: "+12%",
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Instagram Analytics</h1>
      </div>

      {/* Data Loader */}
      <div className="px-4">
        <DataLoader />
      </div>

      {/* Filters */}
      <div className="px-4">
        <FiltersComponent 
          filters={filters}
          onFiltersChange={setFilters}
          availableProfiles={availableProfiles}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-4 sm:p-6 bg-card border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <div className="text-primary">
                  {stat.icon}
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${
                stat.trend === "up" ? "text-success" : "text-warning"
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
              <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">
                {summaryLoading ? "..." : stat.value}
              </h3>
              <p className="text-muted-foreground text-sm">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="px-4">
        <PerformanceChart 
          data={performanceData || []} 
          isLoading={performanceLoading} 
        />
      </div>

      {/* Top Performing Content Card */}
      {summary?.topPerformingPost && (
        <Card className="mx-4 p-4 sm:p-6 bg-card border-border shadow-card">
          <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">
            🏆 Top Performing Content
          </h3>
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <img 
              src={summary.topPerformingPost.thumbnail_url} 
              alt="Top performing content"
              className="w-full sm:w-20 h-48 sm:h-20 rounded-lg object-cover"
            />
            <div className="flex-1 space-y-2">
              <p className="text-card-foreground font-medium">
                {summary.topPerformingPost.caption || 'No caption available'}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>❤️ {summary.topPerformingPost.total_likes.toLocaleString()}</span>
                <span>💬 {summary.topPerformingPost.total_comments.toLocaleString()}</span>
                <span>👁️ {summary.topPerformingPost.total_views.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Profile: @{summary.topPerformingPost.tracked_profile_id}
              </div>
              {summary.topPerformingPost.ai_performance_summary && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  AI Insight: {summary.topPerformingPost.ai_performance_summary}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content Table */}
      <div className="px-4">
        <ContentTable 
          content={contentList || []} 
          isLoading={contentLoading} 
        />
      </div>

      {/* No Data State */}
      {!summaryLoading && (!summary || summary.totalPosts === 0) && (
        <Card className="mx-4 p-8 sm:p-12 bg-card border-border shadow-card text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">
              No Instagram Data Found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
              Use the Data Loader above to fetch Instagram data for analysis. 
              Your analytics dashboard will populate once data is loaded.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
