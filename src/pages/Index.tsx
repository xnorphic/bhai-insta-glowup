
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { Home } from "@/components/Home";
import { InstagramAnalytics } from "@/components/InstagramAnalytics";
import { InstagramConnect } from "@/components/instagram/InstagramConnect";
import { CompetitionAnalysis } from "@/components/CompetitionAnalysis";
import { BrandbookBuilder } from "@/components/BrandbookBuilder";
import { ContentCalendar } from "@/components/ContentCalendar";
import { Settings } from "@/components/Settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "home":
        return <Home onTabChange={setActiveTab} />;
      case "analytics":
        return <InstagramAnalytics />;
      case "connect":
        return <InstagramConnect />;
      case "competition":
        return <CompetitionAnalysis />;
      case "brandbook":
        return <BrandbookBuilder />;
      case "calendar":
        return <ContentCalendar />;
      case "settings":
        return <Settings />;
      default:
        return <Home onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[hsl(232,98%,95%)] to-[hsl(232,98%,90%)]">
      <div className="flex w-full">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
