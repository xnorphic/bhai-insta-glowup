
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, BarChart3 } from "lucide-react";

interface MetricsProps {
  profileName: string;
  isOwned: boolean;
  data: {
    totalPosts: number;
    totalEngagement: number;
    engagementChange: number;
    avgPostTime: string;
    contentTypes: {
      posts: number;
      carousels: number;
      reels: number;
    };
  };
}

export const CompetitionMetrics = ({ profileName, isOwned, data }: MetricsProps) => {
  const isPositiveChange = data.engagementChange > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#333333]">{profileName}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOwned 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isOwned ? 'Owned' : 'Competitor'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-[#333333]">{data.totalPosts}</p>
              <p className="text-sm text-[#666666]">Total Posts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            {isPositiveChange ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="text-2xl font-bold text-[#333333]">
                {data.totalEngagement.toLocaleString()}
              </p>
              <p className={`text-sm font-medium ${
                isPositiveChange ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveChange ? '+' : ''}{data.engagementChange}% vs last week
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-purple-500" />
          <p className="font-medium text-[#333333]">Peak Posting Time</p>
        </div>
        <p className="text-lg font-semibold text-[#333333]">{data.avgPostTime}</p>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium text-[#333333] mb-3">Content Distribution</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Posts</span>
            <span className="font-medium">{data.contentTypes.posts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Carousels</span>
            <span className="font-medium">{data.contentTypes.carousels}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Reels</span>
            <span className="font-medium">{data.contentTypes.reels}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
