
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  Calendar, 
  Target, 
  BookOpen, 
  Link
} from "lucide-react";

interface HomeProps {
  onTabChange: (tab: string) => void;
}

export const Home = ({ onTabChange }: HomeProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = ["Copy-Writing", "Content Planning", "Ideation"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      id: "analytics",
      title: "Instagram Analytics",
      description: "Track your performance with detailed insights and metrics",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      id: "connect",
      title: "Connect Instagram",
      description: "Link your Instagram account to unlock powerful features",
      icon: Link,
      color: "text-green-600"
    },
    {
      id: "calendar",
      title: "Content Calendar",
      description: "Plan and schedule your content with AI-powered suggestions",
      icon: Calendar,
      color: "text-purple-600"
    },
    {
      id: "competition",
      title: "Competition Analysis",
      description: "Analyze competitors and discover winning content strategies",
      icon: Target,
      color: "text-red-600"
    },
    {
      id: "brandbook",
      title: "Brandbook Builder",
      description: "Create comprehensive brand guidelines with AI assistance",
      icon: BookOpen,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          {/* First Line */}
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            <span>Get </span>
            <span className="relative inline-block min-w-[200px] sm:min-w-[280px] md:min-w-[400px]">
              <span 
                key={currentWordIndex}
                className="inline-block text-primary animate-fadeInScale"
              >
                {words[currentWordIndex]}
              </span>
            </span>
            <span> done</span>
          </div>
          
          {/* Second Line */}
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            <span>with Agentic </span>
            <span 
              className="bg-gradient-primary bg-clip-text text-transparent animate-gradientShift"
            >
              AI
            </span>
          </div>
        </div>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
          Supercharge your social media strategy with AI-powered analytics, content planning, and competitor insights. Use the sidebar to navigate between different features.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.id}
              className="group hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-border bg-card"
            >
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 sm:mt-12 px-4">
        <div className="text-center space-y-2">
          <h4 className="text-2xl sm:text-3xl font-bold text-primary">AI-Powered</h4>
          <p className="text-muted-foreground text-sm sm:text-base">Advanced algorithms for better insights</p>
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-2xl sm:text-3xl font-bold text-primary">Real-time</h4>
          <p className="text-muted-foreground text-sm sm:text-base">Live data and instant analytics</p>
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-2xl sm:text-3xl font-bold text-primary">Automated</h4>
          <p className="text-muted-foreground text-sm sm:text-base">Streamlined workflows and planning</p>
        </div>
      </div>
    </div>
  );
};
