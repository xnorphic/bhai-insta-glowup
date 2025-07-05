
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PerformanceData {
  type: string;
  count: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  isLoading: boolean;
}

export const PerformanceChart = ({ data, isLoading }: PerformanceChartProps) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance by Content Type</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-[#666666]">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance by Content Type</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-[#666666]">No data available</p>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    Posts: item.count,
    Likes: item.totalLikes,
    Comments: item.totalComments,
    Views: item.totalViews,
  }));

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance by Content Type</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Posts" fill="hsl(240, 70%, 70%)" />
            <Bar dataKey="Likes" fill="hsl(20, 90%, 65%)" />
            <Bar dataKey="Comments" fill="hsl(240, 50%, 40%)" />
            <Bar dataKey="Views" fill="hsl(240, 30%, 60%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
