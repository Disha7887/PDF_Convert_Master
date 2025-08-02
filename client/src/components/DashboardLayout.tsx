import React from "react";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      {children}
    </div>
  );
};
