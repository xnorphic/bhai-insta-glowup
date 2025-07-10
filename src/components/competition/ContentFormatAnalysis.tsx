import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Heart, MessageCircle, Share2, Eye, TrendingUp, TrendingDown, Clock, Percent } from "lucide-react";

interface ContentFormatData {
  type: 'posts' | 'reels' | 'carousels';
  count: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  avgEngagementPer: number;
  first24hEngagement: number;
  sentimentScore: number;
  distributionChange: number;
}

interface ContentFormatAnalysisProps {
  profileName: string;
  isOwned: boolean;
  data: ContentFormatData[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

// Mock detailed data for demonstration
const mockData: Record<string, ContentFormatData[]> = {
  owned: [
    {
      type: 'posts',
      count: 20,
      totalLikes: 45000,
      totalComments: 1200,
      totalViews: 89000,
      avgEngagementPer: 2.3,
      first24hEngagement: 78,
      sentimentScore: 4.2,
      distributionChange: -5.2
    },
    {
      type: 'reels',
      count: 10,
      totalLikes: 78000,
      totalComments: 890,
      totalViews: 125000,
      avgEngagementPer: 4.8,
      first24hEngagement: 85,
      sentimentScore: 4.5,
      distributionChange: 12.3
    },
    {
      type: 'carousels',
      count: 15,
      totalLikes: 52000,
      totalComments: 1450,
      totalViews: 67000,
      avgEngagementPer: 3.1,
      first24hEngagement: 72,
      sentimentScore: 4.1,
      distributionChange: -2.1
    }
  ],
  competitor: [
    {
      type: 'posts',
      count: 18,
      totalLikes: 52000,
      totalComments: 980,
      totalViews: 95000,
      avgEngagementPer: 2.8,
      first24hEngagement: 82,
      sentimentScore: 4.3,
      distributionChange: -8.1
    },
    {
      type: 'reels',
      count: 8,
      totalLikes: 89000,
      totalComments: 1200,
      totalViews: 145000,
      avgEngagementPer: 5.2,
      first24hEngagement: 88,
      sentimentScore: 4.7,
      distributionChange: 15.6
    },
    {
      type: 'carousels',
      count: 12,
      totalLikes: 48000,
      totalComments: 1100,
      totalViews: 72000,
      avgEngagementPer: 3.4,
      first24hEngagement: 75,
      sentimentScore: 4.0,
      distributionChange: -3.2
    }
  ]
};

export const ContentFormatAnalysis: React.FC<ContentFormatAnalysisProps> = ({
  profileName,
  isOwned,
  data: propData
}) => {
  const data = propData || mockData[isOwned ? 'owned' : 'competitor'];
  
  const pieData = data.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
    color: COLORS[data.indexOf(item)]
  }));

  const engagementData = data.map(item => ({
    type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    avgEngagement: item.avgEngagementPer,
    first24h: item.first24hEngagement
  }));

  const getSentimentColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {profileName} - Content Format Analysis
          </h3>
          {isOwned && <Badge variant="secondary">Your Profile</Badge>}
        </div>

        {/* Content Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Content Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Engagement Comparison</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgEngagement" fill="#8884d8" name="Avg Engagement %" />
                <Bar dataKey="first24h" fill="#82ca9d" name="First 24h %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Format Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Detailed Format Metrics</h4>
          {data.map((format) => {
            const ChangeIcon = getChangeIcon(format.distributionChange);
            return (
              <Card key={format.type} className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-foreground capitalize">{format.type}</h5>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getChangeColor(format.distributionChange)}`}>
                      {format.distributionChange > 0 ? '+' : ''}{format.distributionChange}%
                    </span>
                    <ChangeIcon className={`w-4 h-4 ${getChangeColor(format.distributionChange)}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Posts</span>
                    </div>
                    <p className="font-semibold text-foreground">{format.count}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Heart className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm text-muted-foreground">Likes</span>
                    </div>
                    <p className="font-semibold text-foreground">{(format.totalLikes / 1000).toFixed(1)}K</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MessageCircle className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-muted-foreground">Comments</span>
                    </div>
                    <p className="font-semibold text-foreground">{format.totalComments.toLocaleString()}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Percent className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-muted-foreground">Avg Eng.</span>
                    </div>
                    <p className="font-semibold text-foreground">{format.avgEngagementPer}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">First 24h Engagement</span>
                      <span className="text-sm font-medium text-foreground">{format.first24hEngagement}%</span>
                    </div>
                    <Progress value={format.first24hEngagement} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sentiment Score</span>
                      <span className={`text-sm font-medium ${getSentimentColor(format.sentimentScore)}`}>
                        {format.sentimentScore}/5.0
                      </span>
                    </div>
                    <Progress value={(format.sentimentScore / 5) * 100} className="h-2" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};