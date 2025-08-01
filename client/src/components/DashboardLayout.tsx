import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};
