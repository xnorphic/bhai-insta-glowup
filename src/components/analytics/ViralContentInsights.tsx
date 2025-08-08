import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Zap, Share2, Play } from "lucide-react";
import type { AnalyticsSummary } from "@/services/instagramService";

interface ViralContentInsightsProps {
  viralStats: AnalyticsSummary['viralStats'];
  totalPosts: number;
}

export const ViralContentInsights = ({ viralStats, totalPosts }: ViralContentInsightsProps) => {
  const getPercentage = (count: number) => totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const viralCards = [
    {
      title: "Trending in Clips",
      count: viralStats.trendingClips,
      percentage: getPercentage(viralStats.trendingClips),
      icon: TrendingUp,
      color: "bg-red-500",
      description: "Featured in Instagram trending"
    },
    {
      title: "Viral Content",
      count: viralStats.viralContent,
      percentage: getPercentage(viralStats.viralContent),
      icon: Zap,
      color: "bg-yellow-500",
      description: "High reshare performance"
    },
    {
      title: "Total Reshares",
      count: viralStats.totalReshares,
      percentage: 100,
      icon: Share2,
      color: "bg-blue-500",
      description: "Cumulative reshare count",
      isTotal: true
    },
    {
      title: "Avg Play Count",
      count: viralStats.avgPlayCount,
      percentage: 100,
      icon: Play,
      color: "bg-green-500",
      description: "Average video plays",
      isTotal: true
    }
  ];

  const getViralRate = () => {
    return totalPosts > 0 ? ((viralStats.viralContent / totalPosts) * 100).toFixed(1) : '0';
  };

  const getTrendingRate = () => {
    return totalPosts > 0 ? ((viralStats.trendingClips / totalPosts) * 100).toFixed(1) : '0';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Viral Content Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {viralCards.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.title} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${insight.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {insight.isTotal ? formatNumber(insight.count) : insight.count}
                  </Badge>
                </div>
                {!insight.isTotal && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Of total posts</span>
                      <span>{insight.percentage}%</span>
                    </div>
                    <Progress value={insight.percentage} className="h-2" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{getTrendingRate()}%</div>
              <div className="text-sm text-red-700">Trending Rate</div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{getViralRate()}%</div>
              <div className="text-sm text-yellow-700">Viral Rate</div>
            </div>
          </div>
        </div>

        {totalPosts > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Performance Insights</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {parseFloat(getViralRate()) > 5 && (
                <p>• Excellent viral content rate! Your content resonates strongly with audiences</p>
              )}
              {parseFloat(getTrendingRate()) > 2 && (
                <p>• Strong trending presence indicates algorithm-friendly content</p>
              )}
              {viralStats.avgPlayCount > 10000 && (
                <p>• High average play count suggests engaging video content</p>
              )}
              {viralStats.totalReshares > viralStats.viralContent * 100 && (
                <p>• Exceptional reshare performance amplifies your reach significantly</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};