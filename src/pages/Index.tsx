
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
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const isMobile = useIsMobile();

  const renderActiveComponent = () => {
    console.log(`Rendering component for activeTab: ${activeTab}`);
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
    <Dashboard>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pt-16' : ''} p-6`}>
        {renderActiveComponent()}
      </div>
    </Dashboard>
  );
};

export default Index;
