
import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { InstagramAnalytics } from "./InstagramAnalytics";
import { InstagramConnect } from "./instagram/InstagramConnect";
import { ContentCalendar } from "./ContentCalendar";
import { CompetitionAnalysis } from "./CompetitionAnalysis";
import { BrandbookBuilder } from "./BrandbookBuilder";
import { Settings } from "./Settings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <InstagramAnalytics />;
      case "connect":
        return <InstagramConnect />;
      case "calendar":
        return <ContentCalendar />;
      case "competition":
        return <CompetitionAnalysis />;
      case "brandbook":
        return <BrandbookBuilder />;
      case "settings":
        return <Settings />;
      default:
        return <InstagramAnalytics />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">bhAI Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
