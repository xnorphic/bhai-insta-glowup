
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon } from "lucide-react";
import { CompetitionMetrics } from "./CompetitionMetrics";
import { TopPerformingPosts } from "./TopPerformingPosts";
import { AIInsights } from "./AIInsights";

// Dummy data for demonstration
const dummyData = {
  owned: {
    profileName: "Naukri.com",
    metrics: {
      totalPosts: 28,
      totalEngagement: 145000,
      engagementChange: 12.5,
      avgPostTime: "2:30 PM",
      contentTypes: {
        posts: 15,
        carousels: 8,
        reels: 5
      }
    },
    topPosts: [
      {
        id: "1",
        thumbnail: "",
        caption: "5 skills that will make you irreplaceable in 2024. Save this post and start building these skills today! 💪",
        likes: 15600,
        comments: 234,
        views: 45000,
        type: "carousel" as const,
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
    ]
  },
  competitor: {
    profileName: "Swiggy India",
    metrics: {
      totalPosts: 42,
      totalEngagement: 189000,
      engagementChange: -3.2,
      avgPostTime: "7:45 PM",
      contentTypes: {
        posts: 12,
        carousels: 15,
        reels: 15
      }
    },
    topPosts: [
      {
        id: "1",
        thumbnail: "",
        caption: "POV: When you order from your favorite restaurant for the 5th time this week 😅 Tag someone who does this!",
        likes: 24500,
        comments: 456,
        views: 78000,
        type: "reel" as const,
        date: "1 day ago"
      },
      {
        id: "2",
        thumbnail: "",
        caption: "Mood after finding out your favorite dish is available on Swiggy 🤤 What's your comfort food?",
        likes: 18900,
        comments: 324,
        views: 56000,
        type: "reel" as const,
        date: "3 days ago"
      },
      {
        id: "3",
        thumbnail: "",
        caption: "Types of people when ordering food. Which one are you? Swipe to find out! ➡️",
        likes: 16700,
        comments: 278,
        views: 48000,
        type: "carousel" as const,
        date: "5 days ago"
      },
      {
        id: "4",
        thumbnail: "",
        caption: "Late night cravings hitting different 🌙 What's your go-to midnight snack? Tell us below!",
        likes: 14200,
        comments: 189,
        views: 42000,
        type: "post" as const,
        date: "1 week ago"
      },
      {
        id: "5",
        thumbnail: "",
        caption: "When you're trying to eat healthy but Swiggy notifications keep popping up 😂",
        likes: 13800,
        comments: 234,
        views: 39000,
        type: "reel" as const,
        date: "1 week ago"
      }
    ]
  }
};

const brandBookData = {
  tonality: "Professional yet approachable, empowering and motivational",
  strategy_pillars: "Career empowerment, skill development, job market insights",
  content_ips: "Career advice, interview tips, salary guidance, industry trends",
  customer_personas: "Job seekers, career changers, working professionals"
};

export const CompetitionAnalysisPage = () => {
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [selectedCompetitor, setSelectedCompetitor] = useState("swiggy");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#333333]">Competition Analysis</h1>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-40">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="swiggy">Swiggy India</SelectItem>
              <SelectItem value="zomato">Zomato</SelectItem>
              <SelectItem value="paytm">Paytm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Side-by-Side Comparison</TabsTrigger>
          <TabsTrigger value="performance">Top Performing Content</TabsTrigger>
          <TabsTrigger value="insights">AI Strategy Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CompetitionMetrics 
                profileName={dummyData.owned.profileName}
                isOwned={true}
                data={dummyData.owned.metrics}
              />
            </Card>
            
            <Card className="p-6">
              <CompetitionMetrics 
                profileName={dummyData.competitor.profileName}
                isOwned={false}
                data={dummyData.competitor.metrics}
              />
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-[#666666] mb-1">Content Volume</p>
                <p className="text-lg font-semibold text-[#333333]">
                  {dummyData.owned.metrics.totalPosts} vs {dummyData.competitor.metrics.totalPosts}
                </p>
                <p className="text-xs text-red-600">-33% behind</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-[#666666] mb-1">Engagement Rate</p>
                <p className="text-lg font-semibold text-[#333333]">5.2% vs 4.5%</p>
                <p className="text-xs text-green-600">+15% ahead</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-[#666666] mb-1">Reel Performance</p>
                <p className="text-lg font-semibold text-[#333333]">9K vs 18K</p>
                <p className="text-xs text-red-600">-50% behind</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-[#666666] mb-1">Peak Time</p>
                <p className="text-lg font-semibold text-[#333333]">2:30 PM vs 7:45 PM</p>
                <p className="text-xs text-blue-600">Different strategy</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPerformingPosts 
              profileName={dummyData.owned.profileName}
              posts={dummyData.owned.topPosts}
            />
            
            <TopPerformingPosts 
              profileName={dummyData.competitor.profileName}
              posts={dummyData.competitor.topPosts}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <AIInsights brandBookData={brandBookData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
