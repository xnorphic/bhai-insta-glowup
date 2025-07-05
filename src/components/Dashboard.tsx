
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle } from "lucide-react";

export const Dashboard = () => {
  const [observationPeriod, setObservationPeriod] = useState("7");
  const [selectedProfile, setSelectedProfile] = useState("naukridotcom");

  // Placeholder data - replace with actual API data
  const stats = [
    {
      title: "Content Count",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: <Eye className="w-5 h-5" />
    },
    {
      title: "Total Engagement",
      value: "1.2K",
      change: "+8.5%",
      trend: "up",
      icon: <Heart className="w-5 h-5" />
    },
    {
      title: "Total Views",
      value: "15.6K",
      change: "-2.1%",
      trend: "down",
      icon: <Eye className="w-5 h-5" />
    },
    {
      title: "Engagement/Post",
      value: "50",
      change: "+5.3%",
      trend: "up",
      icon: <MessageCircle className="w-5 h-5" />
    }
  ];

  const aiSuggestions = [
    "🎵 Trending Audio: 'Office Hustle Beat' - Perfect for Monday motivation reels",
    "📈 Your competitor posted 3x more carousel content this week - consider diversifying",
    "💡 Friday posts get 40% more engagement - schedule your best content then",
    "🎯 Educational content about career growth performs 60% better than memes",
  ];

  const upcomingEvents = [
    { date: "Dec 25", event: "Christmas", idea: "Office Secret Santa chaos reel" },
    { date: "Dec 31", event: "New Year", idea: "2024 career resolutions carousel" },
    { date: "Jan 26", event: "Republic Day", idea: "Patriotic office vibes post" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#333333]">Dashboard</h1>
        <div className="flex space-x-4">
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="naukridotcom">@naukridotcom</SelectItem>
              <SelectItem value="competitor1">@competitor1</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={observationPeriod} onValueChange={setObservationPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[hsl(240,70%,70%)]/10 rounded-lg">
                {stat.icon}
              </div>
              <div className={`flex items-center space-x-1 ${
                stat.trend === "up" ? "text-green-600" : "text-orange-500"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#333333]">{stat.value}</h3>
              <p className="text-[#666666] text-sm">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-r from-[hsl(240,70%,70%)]/20 to-[hsl(20,90%,65%)]/20 rounded-lg">
            <p className="text-[#666666]">Interactive Chart Coming Soon</p>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-[#333333] mb-4">AI Performance Summary</h3>
          <div className="space-y-3">
            <p className="text-[#666666] leading-relaxed">
              Your Monday motivation post about "surviving office meetings" generated the highest engagement 
              this week with 150+ likes. The spike correlates with typical Monday blues sentiment.
            </p>
            <p className="text-[#666666] leading-relaxed">
              Friday's career tip carousel saw a 40% dip in engagement, likely due to weekend mindset. 
              Consider posting career content earlier in the week.
            </p>
          </div>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">🤖 AI Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiSuggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-[hsl(240,70%,70%)]/5 rounded-lg border-l-4 border-[hsl(240,50%,40%)]">
              <p className="text-[#666666] text-sm">{suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">📅 Upcoming Content Opportunities</h3>
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-[hsl(20,90%,65%)]/10 to-transparent rounded-lg">
              <div>
                <p className="font-medium text-[#333333]">{event.date} - {event.event}</p>
                <p className="text-[#666666] text-sm">{event.idea}</p>
              </div>
              <div className="w-12 h-12 bg-[hsl(240,50%,40%)] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{event.date.split(' ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
