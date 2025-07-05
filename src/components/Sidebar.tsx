
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings as SettingsIcon 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "competition", label: "Competition", icon: Users },
    { id: "brandbook", label: "Brand Book", icon: BookOpen },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-[hsl(240,50%,40%)] min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">bhAI</h1>
        <p className="text-white/70 text-sm">Social Media Bro Tool</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-[hsl(240,70%,70%)] text-white font-medium"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
