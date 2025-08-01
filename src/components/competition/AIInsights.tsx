
import { Card } from "@/components/ui/card";
import { Lightbulb, Target, TrendingUp, Calendar } from "lucide-react";

interface AIInsightsProps {
  brandBookData?: {
    tonality?: string;
    strategy_pillars?: string;
    content_ips?: string;
    customer_personas?: string;
  };
}

export const AIInsights = ({ brandBookData }: AIInsightsProps) => {
  // This would normally be generated by AI based on the comparison data
  const insights = {
    keyFindings: [
      "Competitor posts 40% more content but has 25% lower engagement rate",
      "Your peak posting time (2-4 PM) aligns well with audience activity",
      "Reels perform 3x better than static posts for both profiles",
      "Competitor's carousel posts get 60% more comments than yours"
    ],
    recommendations: [
      {
        title: "Optimize Content Mix",
        description: "Increase reel production by 150% while maintaining quality. Current 20% reel ratio should move to 50% based on performance data.",
        icon: TrendingUp
      },
      {
        title: "Strategic Timing",
        description: "Maintain current 2-4 PM posting window but test weekend morning slots (9-11 AM) where competitor shows strong engagement.",
        icon: Calendar
      },
      {
        title: "Engagement Tactics",
        description: "Implement interactive carousel posts with polls and questions. Your current carousel engagement is 40% below potential.",
        icon: Target
      }
    ],
    contentIdeas: [
      "Behind-the-scenes reel series showcasing your brand values and work culture",
      "Educational carousel posts breaking down industry insights in digestible slides",
      "User-generated content campaigns leveraging your customer success stories",
      "Trend-jacking relevant industry conversations with your unique perspective",
      "Interactive Q&A sessions addressing common customer pain points"
    ]
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-[#333333]">AI Strategy Insights</h3>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium text-[#333333] mb-3">Key Findings</h4>
          <ul className="space-y-2">
            {insights.keyFindings.map((finding, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-[#666666]">{finding}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {insights.recommendations.map((rec, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <rec.icon className="w-5 h-5 text-blue-600" />
                <h5 className="font-medium text-[#333333]">{rec.title}</h5>
              </div>
              <p className="text-sm text-[#666666]">{rec.description}</p>
            </div>
          ))}
        </div>

        {brandBookData && (
          <div className="p-4 bg-green-50 rounded-lg mb-6">
            <h4 className="font-medium text-[#333333] mb-2">Brand-Aligned Strategy</h4>
            <p className="text-sm text-[#666666]">
              Based on your brand tonality "{brandBookData.tonality}" and strategy pillars, 
              focus on content that reinforces your core values while adopting the competitor's 
              high-performing content formats. Maintain authenticity while increasing frequency.
            </p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-[#333333] mb-3">Innovative Content Ideas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.contentIdeas.map((idea, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="text-sm text-[#333333]">{idea}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
