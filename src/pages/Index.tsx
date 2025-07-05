
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { InstagramAnalytics } from "@/components/InstagramAnalytics";
import { CompetitionAnalysis } from "@/components/CompetitionAnalysis";
import { BrandbookBuilder } from "@/components/BrandbookBuilder";
import { ContentCalendar } from "@/components/ContentCalendar";
import { Settings } from "@/components/Settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "analytics":
        return <InstagramAnalytics />;
      case "competition":
        return <CompetitionAnalysis />;
      case "brandbook":
        return <BrandbookBuilder />;
      case "calendar":
        return <ContentCalendar />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[hsl(232,98%,95%)] to-[hsl(232,98%,90%)]">
      <div className="flex w-full">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
