import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, UserPlus, Share2, DollarSign } from "lucide-react";
import type { AnalyticsSummary } from "@/services/instagramService";

interface CollaborationInsightsProps {
  collaborationStats: AnalyticsSummary['collaborationStats'];
  totalPosts: number;
}

export const CollaborationInsights = ({ collaborationStats, totalPosts }: CollaborationInsightsProps) => {
  const getPercentage = (count: number) => totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;

  const insightCards = [
    {
      title: "Original Content",
      count: collaborationStats.originalContent,
      percentage: getPercentage(collaborationStats.originalContent),
      icon: Users,
      color: "bg-blue-500",
      description: "Self-created content"
    },
    {
      title: "Collaborations",
      count: collaborationStats.collaborations,
      percentage: getPercentage(collaborationStats.collaborations),
      icon: UserPlus,
      color: "bg-green-500",
      description: "Partnership content"
    },
    {
      title: "User Generated",
      count: collaborationStats.userGenerated,
      percentage: getPercentage(collaborationStats.userGenerated),
      icon: Share2,
      color: "bg-purple-500",
      description: "Reshared content"
    },
    {
      title: "Paid Partnerships",
      count: collaborationStats.paidPartnerships,
      percentage: getPercentage(collaborationStats.paidPartnerships),
      icon: DollarSign,
      color: "bg-orange-500",
      description: "Sponsored content"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaboration Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightCards.map((insight) => {
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
                  <Badge variant="secondary">{insight.count}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Share of total</span>
                    <span>{insight.percentage}%</span>
                  </div>
                  <Progress value={insight.percentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
        
        {totalPosts > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Strategy Insights</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {collaborationStats.collaborations > collaborationStats.originalContent * 0.3 && (
                <p>• High collaboration rate indicates strong partnership strategy</p>
              )}
              {collaborationStats.userGenerated > 0 && (
                <p>• User-generated content shows active community engagement</p>
              )}
              {collaborationStats.paidPartnerships > totalPosts * 0.1 && (
                <p>• Significant sponsored content presence - monitor FTC compliance</p>
              )}
              {collaborationStats.originalContent / totalPosts > 0.7 && (
                <p>• Strong original content foundation builds authentic brand voice</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};