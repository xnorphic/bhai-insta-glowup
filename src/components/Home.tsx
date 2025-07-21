
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <style>
        {`
          @keyframes fadeInScale {
            0%, 100% { opacity: 1; transform: scale(1); }
            33% { opacity: 0; transform: scale(0.8); }
            66% { opacity: 0; transform: scale(0.8); }
          }
        `}
      </style>
      
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Get{" "}
          <span className="relative inline-block">
            <span 
              key={currentWordIndex}
              className="inline-block animate-fade-in text-primary"
              style={{
                animation: "fadeInScale 3s ease-in-out infinite"
              }}
            >
              {words[currentWordIndex]}
            </span>
          </span>
          {" "}done with AgenticAI
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Supercharge your social media strategy with AI-powered analytics, content planning, and competitor insights. Use the sidebar to navigate between different features.
        </p>
      </div>

      {/* Feature Cards - now display only, no navigation */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
                    <Icon className={`w-8 h-8 ${feature.color} group-hover:text-primary transition-colors`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="text-center space-y-2">
          <h4 className="text-3xl font-bold text-primary">AI-Powered</h4>
          <p className="text-gray-600">Advanced algorithms for better insights</p>
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-3xl font-bold text-primary">Real-time</h4>
          <p className="text-gray-600">Live data and instant analytics</p>
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-3xl font-bold text-primary">Automated</h4>
          <p className="text-gray-600">Streamlined workflows and planning</p>
        </div>
      </div>
    </div>
  );
};
