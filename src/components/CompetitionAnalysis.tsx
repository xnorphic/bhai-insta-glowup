
import { Card } from "@/components/ui/card";

export const CompetitionAnalysis = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#333333]">Competition Analysis</h1>
      <Card className="p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-[#333333]">Competitor Insights Coming Soon</h2>
          <p className="text-[#666666] max-w-2xl mx-auto">
            Analyze competitor performance, trending content, and get AI-powered comparison insights.
          </p>
        </div>
      </Card>
    </div>
  );
};
