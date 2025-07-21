
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  Target, 
  BookOpen, 
  Settings as SettingsIcon, 
  Instagram,
  Link
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const menuItems = [
    { id: "home", label: "Home", icon: Instagram },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "connect", label: "Connect Instagram", icon: Link },
    { id: "calendar", label: "Content Calendar", icon: Calendar },
    { id: "competition", label: "Competition Analysis", icon: Target },
    { id: "brandbook", label: "Brandbook Builder", icon: BookOpen },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Instagram className="w-8 h-8 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">bhAI</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">Social Media Analytics</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    activeTab === item.id 
                      ? "bg-purple-600 hover:bg-purple-700 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    console.log(`Sidebar button clicked: ${item.id}, current activeTab: ${activeTab}`);
                    onTabChange(item.id);
                  }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
