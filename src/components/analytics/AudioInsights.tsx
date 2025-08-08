import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, TrendingUp, Users } from "lucide-react";
import type { AnalyticsSummary } from "@/services/instagramService";

interface AudioInsightsProps {
  topAudioTracks: AnalyticsSummary['topAudioTracks'];
}

export const AudioInsights = ({ topAudioTracks }: AudioInsightsProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getEngagementLevel = (engagement: number) => {
    if (engagement > 1000) return { label: "High", color: "bg-green-500" };
    if (engagement > 500) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Low", color: "bg-gray-500" };
  };

  if (topAudioTracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audio data available</p>
            <p className="text-sm">Upload content with audio information to see insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Top Audio Tracks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topAudioTracks.map((track, index) => {
            const engagementLevel = getEngagementLevel(track.avgEngagement);
            
            return (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{track.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {track.usageCount}
                    </Badge>
                    <Badge variant="outline" className={`${engagementLevel.color} text-white border-0`}>
                      {engagementLevel.label}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Usage Count: </span>
                    <span className="font-medium">{track.usageCount} posts</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Engagement: </span>
                    <span className="font-medium">{formatNumber(track.avgEngagement)}</span>
                  </div>
                </div>
                
                {index === 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                    <TrendingUp className="h-3 w-3" />
                    Most popular audio track
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Audio Strategy Tips</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Use your top-performing audio tracks for new content</p>
            <p>• Monitor trending audio for early adoption opportunities</p>
            <p>• Consider collaborating with artists of high-engagement tracks</p>
            {topAudioTracks.some(track => track.usageCount > 3) && (
              <p>• Your repeated use of certain tracks shows strong brand audio identity</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};