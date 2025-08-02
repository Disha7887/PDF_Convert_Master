import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { NavigationSection } from '@/pages/sections/NavigationSection';
import { FooterSection } from '@/pages/sections/FooterSection';
import { HeroSection } from '@/pages/sections/HeroSection';

interface GlobalLayoutProps {
  children: React.ReactNode;
  showHero?: boolean;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children, showHero = false }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - conditional based on authentication */}
      {isAuthenticated ? <DashboardHeader /> : <NavigationSection />}
      
      {/* Hero Section - only show on home page for non-authenticated users */}
      {showHero && !isAuthenticated && <HeroSection />}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer - always visible */}
      <FooterSection />
    </div>
  );
};