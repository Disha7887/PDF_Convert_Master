import React, { useState } from "react";
import logoIcon from "@assets/IconOnly_Transparent_NoBuffer_1782108807761.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ToolsNavDropdowns, MobileNav } from "@/components/ToolsNavMenu";
import { ToolSearch } from "@/components/ToolSearch";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Home,
  Wrench,
  BookOpen
} from "lucide-react";

export const DashboardHeader = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const { user, signout } = useAuth();

  // Simple (non-dropdown) navigation links; the tool categories render as dropdowns
  const leadingItem = { name: "Home", href: "/dashboard" };
  const trailingItems = [{ name: "About", href: "/about" }];

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      setLocation(href);
    }
  };

  const handleLogoClick = () => {
    setLocation("/dashboard");
  };

  const handleManagePlan = () => {
    setLocation("/dashboard/manage-plans");
  };

  const handleLogout = () => {
    signout();
    setLocation("/");
  };

  return (
    <header className="relative z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={logoIcon} alt="PDF Convert Master" className="h-9 w-auto" />
            <h1 className="[font-family:'Poppins',Helvetica] font-bold text-gray-900 text-base sm:text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>
        </div>

        {/* Center - Navigation Menu */}
        <NavigationMenu className="hidden xl:flex justify-center">
          <NavigationMenuList className="flex items-center space-x-6">
            <NavigationMenuItem>
              <NavigationMenuLink
                className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                onClick={() => handleNavClick(leadingItem.href)}
                data-testid="nav-home"
              >
                {leadingItem.name}
              </NavigationMenuLink>
            </NavigationMenuItem>

            <ToolsNavDropdowns />

            {trailingItems.map((item, index) => (
              <NavigationMenuItem key={index}>
                <NavigationMenuLink
                  className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => handleNavClick(item.href)}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right - Plan Status, Notifications and Profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Plan Status */}
          <div className="hidden xl:flex items-center px-3 py-2 rounded-lg border border-blue-200 bg-blue-50">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-blue-700">{user?.plan || 'Pro Plan'}</span>
          </div>

          {/* Manage Plan Button */}
          <Button variant="outline" className="hidden xl:inline-flex text-sm" onClick={handleManagePlan}>
            <Settings className="w-4 h-4 mr-2" />
            Manage Plan
          </Button>

          {/* Tool Search */}
          <ToolSearch variant="icon" className="hidden sm:inline-flex" />

          {/* Notifications */}
          <Button variant="outline" size="icon" className="hidden sm:inline-flex relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="px-4 py-2 rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-semibold">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div className="text-left hidden xl:block max-w-[160px]">
                  <p className="text-sm font-medium truncate">{user?.email || 'User'}</p>
                  <p className="text-xs text-blue-100">{user?.plan || 'Free Plan'}</p>
                </div>
                <ChevronDown className="w-4 h-4 hidden xl:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setLocation("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <div className="xl:hidden">
            <MobileNav
              homeItem={leadingItem}
              trailingItems={trailingItems}
              footer={(close) => (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleManagePlan();
                    close();
                  }}
                  data-testid="mobile-button-manage-plan"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Plan
                </Button>
              )}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
