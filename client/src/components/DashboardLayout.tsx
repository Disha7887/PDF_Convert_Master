import React from "react";
import { DashboardHeader } from "./DashboardHeader";
import { FooterSection } from "@/pages/sections/FooterSection";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="flex-1">
        {children}
      </main>
      <FooterSection />
    </div>
  );
};
