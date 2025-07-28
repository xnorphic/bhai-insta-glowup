import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, TrendingUp, Users, Heart, MessageCircle } from "lucide-react";
import { instagramService } from "@/services/instagramService";
import { AnalyticsFilters } from "./analytics/AnalyticsFilters";
import { ContentTable } from "./analytics/ContentTable";
import { PerformanceChart } from "./analytics/PerformanceChart";
import { DataLoader } from "./instagram/DataLoader";

export const InstagramAnalytics = () => {
  const [filters, setFilters] = useState({});

  const { data: analyticsSummary, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['instagram-analytics-summary', filters],
    queryFn: () => instagramService.getAnalyticsSummary(filters),
  });

  const { data: contentList, isLoading: isLoadingContent } = useQuery({
    queryKey: ['instagram-content-list', filters],
    queryFn: () => instagramService.getContentList(filters, 20),
  });

  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['instagram-performance-data', filters],
    queryFn: () => instagramService.getPerformanceByType(filters),
  });

  // Mock available profiles for filters - this would normally come from a query
  const availableProfiles = ['your_profile', 'competitor_1'];

  if (analyticsError) {
    return (
      <div className="space-y-6">
        <DataLoader />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please ensure you have connected Instagram profiles and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasData = analyticsSummary && analyticsSummary.totalPosts > 0;

  return (
    <div className="space-y-6">
      <DataLoader />
      
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold">Instagram Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze your Instagram performance
          </p>
        </div>
        
        <AnalyticsFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
          availableProfiles={availableProfiles}
        />
      </div>

      {!hasData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              No Data Found
            </CardTitle>
            <CardDescription>
              No Instagram data found. Please connect an Instagram profile and sync your content to view analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsSummary.totalPosts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsSummary.totalLikes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {analyticsSummary.avgLikesPerPost} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsSummary.totalComments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {analyticsSummary.avgCommentsPerPost} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsSummary.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          {performanceData && performanceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Content Type</CardTitle>
                <CardDescription>
                  Compare engagement across different types of content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart 
                  data={performanceData} 
                  isLoading={isLoadingPerformance}
                />
              </CardContent>
            </Card>
          )}

          {/* Top Performing Post */}
          {analyticsSummary.topPerformingPost && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Post</CardTitle>
                <CardDescription>
                  Your highest engagement post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img 
                    src={analyticsSummary.topPerformingPost.thumbnail_url} 
                    alt="Top post"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {analyticsSummary.topPerformingPost.caption?.substring(0, 100)}...
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{analyticsSummary.topPerformingPost.like_count} likes</span>
                      <span>{analyticsSummary.topPerformingPost.comment_count} comments</span>
                      <span>{analyticsSummary.topPerformingPost.view_count} views</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
              <CardDescription>
                Your latest Instagram posts and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentTable 
                content={contentList || []} 
                isLoading={isLoadingContent}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};