
import { Card } from "@/components/ui/card";

export const ContentCalendar = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#333333]">Content Calendar</h1>
      <Card className="p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-[#333333]">AI-Powered Content Planning</h2>
          <p className="text-[#666666] max-w-2xl mx-auto">
            Plan your content around important dates with AI-generated ideas and scheduling.
          </p>
        </div>
      </Card>
    </div>
  );
};
