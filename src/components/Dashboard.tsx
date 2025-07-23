
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
    </div>
  );
};
