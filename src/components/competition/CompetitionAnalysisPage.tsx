import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Heart, MessageCircle, Share2, Eye, TrendingUp, Users, Calendar, Target, Instagram, Plus } from "lucide-react";
import { CompetitionMetrics } from "./CompetitionMetrics";
import { TopPerformingPosts } from "./TopPerformingPosts";
import { AIInsights } from "./AIInsights";
import { ContentFormatAnalysis } from "./ContentFormatAnalysis";

// Dummy data for demonstration
const mockData = {
  naukridotcom: {
    totalPosts: 45,
    totalEngagement: 125000,
    engagementChange: 12.5,
    avgPostTime: "6:00 PM",
    contentTypes: {
      posts: 20,
      carousels: 15,
      reels: 10
    }
  },
  swiggyindia: {
    totalPosts: 38,
    totalEngagement: 180000,
    engagementChange: -5.2,
    avgPostTime: "8:00 PM",
    contentTypes: {
      posts: 18,
      carousels: 12,
      reels: 8
    }
  }
};

const mockTopPosts = [
  {
    id: "1",
    thumbnail: "https://via.placeholder.com/300x300",
    caption: "🎯 Your next career opportunity is just a click away! Join millions who found their dream job through our platform. #CareerGrowth #JobSearch",
    likes: 15420,
    comments: 342,
    views: 89650,
    type: "post" as const,
    date: "2 days ago"
  },
  {
    id: "2",
    thumbnail: "",
    caption: "Monday motivation: Your next opportunity is just one application away. Keep going! 🚀 #CareerGrowth",
    likes: 12400,
    comments: 189,
    views: 38000,
    type: "reel" as const,
    date: "4 days ago"
  },
  {
    id: "3",
    thumbnail: "",
    caption: "How to answer 'Tell me about yourself' in interviews. Swipe for the perfect framework! ➡️",
    likes: 11200,
    comments: 156,
    views: 32000,
    type: "carousel" as const,
    date: "1 week ago"
  },
  {
    id: "4",
    thumbnail: "",
    caption: "Remote work vs Office work: Which one helps your career more? Share your thoughts below! 💭",
    likes: 9800,
    comments: 298,
    views: 28000,
    type: "post" as const,
    date: "1 week ago"
  },
  {
    id: "5",
    thumbnail: "",
    caption: "Salary negotiation tips that actually work. Don't undervalue yourself! 💰 #SalaryNegotiation",
    likes: 8900,
    comments: 134,
    views: 25000,
    type: "reel" as const,
    date: "2 weeks ago"
  }
];

const engagementData = [
  { name: 'Mon', naukri: 4000, swiggy: 2400 },
  { name: 'Tue', naukri: 3000, swiggy: 1398 },
  { name: 'Wed', naukri: 2000, swiggy: 9800 },
  { name: 'Thu', naukri: 2780, swiggy: 3908 },
  { name: 'Fri', naukri: 1890, swiggy: 4800 },
  { name: 'Sat', naukri: 2390, swiggy: 3800 },
  { name: 'Sun', naukri: 3490, swiggy: 4300 },
];

export const CompetitionAnalysisPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#333333]">Competition Analysis</h1>
            <p className="text-[#666666] mt-2">
              Compare your performance against competitors and discover winning strategies
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content Analysis</TabsTrigger>
            <TabsTrigger value="formats">Format Deep Dive</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Metrics Comparison */}
              <CompetitionMetrics 
                profileName="Naukri.com" 
                isOwned={true} 
                data={mockData.naukridotcom}
              />
              <CompetitionMetrics 
                profileName="Swiggy India" 
                isOwned={false} 
                data={mockData.swiggyindia}
              />
              
              {/* Engagement Chart */}
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">Engagement Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="naukri" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Naukri.com (You)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="swiggy" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Swiggy India"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Content Analysis Tab */}
          <TabsContent value="content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopPerformingPosts 
                profileName="Naukri.com (You)" 
                posts={mockTopPosts}
              />
              <TopPerformingPosts 
                profileName="Swiggy India" 
                posts={mockTopPosts.map(post => ({
                  ...post,
                  id: post.id + "_swiggy",
                  caption: "🍽️ " + post.caption.replace("career", "food").replace("job", "meal")
                }))}
              />
            </div>
          </TabsContent>

          {/* Content Format Deep Dive Tab */}
          <TabsContent value="formats">
            <div className="space-y-6">
              <ContentFormatAnalysis
                profileName="Naukri.com" 
                isOwned={true}
                data={undefined}
              />
              <ContentFormatAnalysis
                profileName="Swiggy India" 
                isOwned={false}
                data={undefined}
              />
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights">
            <AIInsights />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
