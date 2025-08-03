import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationSection } from "@/pages/sections/NavigationSection";
import { DashboardHeader } from "./DashboardHeader";
import { FooterSection } from "@/pages/sections/FooterSection";

interface DynamicLayoutProps {
  children: React.ReactNode;
  isDashboardPage?: boolean;
}

export const DynamicLayout = ({ children, isDashboardPage = false }: DynamicLayoutProps): JSX.Element => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For dashboard pages, always use DashboardLayout structure
  if (isDashboardPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1">
          {children}
        </main>
        <FooterSection />
      </div>
    );
  }

  // For regular pages, switch header based on authentication
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated ? (
        // Logged-in users see DashboardHeader on all pages
        <DashboardHeader />
      ) : (
        // Logged-out users see global header with sign in/sign up
        <NavigationSection />
      )}
      <main className="flex-1">
        {children}
      </main>
      <FooterSection />
    </div>
  );
};
