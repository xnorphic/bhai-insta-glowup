
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardProps {
  children: React.ReactNode;
}

export const Dashboard = ({ children }: DashboardProps) => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-subtle">
      {children}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-card">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              bhAI Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Main content will be rendered by the active component */}
        </main>
      </div>
    </div>
  );
};
