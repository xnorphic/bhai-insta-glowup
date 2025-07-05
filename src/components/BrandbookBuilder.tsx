
import { Card } from "@/components/ui/card";

export const BrandbookBuilder = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#333333]">Brand Book Builder</h1>
      <Card className="p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-[#333333]">Brand Guidelines Management</h2>
          <p className="text-[#666666] max-w-2xl mx-auto">
            Upload and manage your brand books with AI-powered analysis and guideline extraction.
          </p>
        </div>
      </Card>
    </div>
  );
};
