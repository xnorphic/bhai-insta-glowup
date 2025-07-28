import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, MessageCircle, Eye, Share } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type InstagramMedia = Database['public']['Tables']['instagram_media']['Row'];

interface ContentTableProps {
  content: InstagramMedia[];
  isLoading: boolean;
}

export const ContentTable = ({ content, isLoading }: ContentTableProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPerformanceBadgeColor = (engagementRate: number | null) => {
    if (!engagementRate) return 'bg-gray-100 text-gray-800';
    if (engagementRate > 5) return 'bg-green-100 text-green-800';
    if (engagementRate > 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceLabel = (engagementRate: number | null) => {
    if (!engagementRate) return 'Unknown';
    if (engagementRate > 5) return 'High';
    if (engagementRate > 2) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">Recent Content</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!content || content.length === 0) {
    return (
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">Recent Content</h3>
        <p className="text-[#666666] text-center py-8">No content found. Connect your Instagram profile to start tracking.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold text-[#333333] mb-4">Recent Content</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-center">
                <Heart className="w-4 h-4 mx-auto" />
              </TableHead>
              <TableHead className="text-center">
                <MessageCircle className="w-4 h-4 mx-auto" />
              </TableHead>
              <TableHead className="text-center">
                <Eye className="w-4 h-4 mx-auto" />
              </TableHead>
              <TableHead className="text-center">
                <Share className="w-4 h-4 mx-auto" />
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.thumbnail_url || item.media_url} 
                      alt="Content thumbnail"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-[#333333] truncate">
                        {item.caption || 'No caption'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {item.media_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[#666666]">
                  {formatDate(item.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge className={getPerformanceBadgeColor(item.engagement_rate)}>
                    {getPerformanceLabel(item.engagement_rate)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {formatNumber(item.like_count)}
                </TableCell>
                <TableCell className="text-center">
                  {formatNumber(item.comment_count)}
                </TableCell>
                <TableCell className="text-center">
                  {formatNumber(item.view_count)}
                </TableCell>
                <TableCell className="text-center">
                  {formatNumber(item.share_count)}
                </TableCell>
                <TableCell>
                  <a 
                    href={item.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[hsl(240,50%,40%)] hover:text-[hsl(240,70%,30%)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};