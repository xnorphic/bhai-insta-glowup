
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  Target, 
  BookOpen, 
  Settings as SettingsIcon, 
  Instagram,
  Link,
  Menu,
  X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const menuItems = [
    { id: "home", label: "Home", icon: Instagram },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "connect", label: "Connect Instagram", icon: Link },
    { id: "calendar", label: "Content Calendar", icon: Calendar },
    { id: "competition", label: "Competition Analysis", icon: Target },
    { id: "brandbook", label: "Brandbook Builder", icon: BookOpen },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Mobile toggle button
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-card"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 bg-card shadow-elevated border-r border-border">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Instagram className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">bhAI</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="p-4">
                <ul className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <Button
                          variant={activeTab === item.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handleItemClick(item.id)}
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
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="w-64 bg-card border-r border-border shadow-card flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Instagram className="w-8 h-8 text-primary" />
          <h2 className="text-xl font-bold text-foreground">bhAI</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Social Media Analytics</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleItemClick(item.id)}
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
