import React, { useState } from "react";
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
  const { user, logout } = useAuth();

  // Navigation menu items data (only Home, Tools, About)
  const navItems = [
    { name: "Home", href: "/dashboard" },
    { name: "Tools", href: "/tools" },
    { name: "About", href: "/about" },
  ];

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
    logout();
    setLocation("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center">
          <div 
            onClick={handleLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="[font-family:'Pacifico',Helvetica] font-normal text-gray-900 text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>
        </div>

        {/* Center - Navigation Menu */}
        <NavigationMenu className="flex justify-center">
          <NavigationMenuList className="flex space-x-6">
            {navItems.map((item, index) => (
              <NavigationMenuItem key={index}>
                <NavigationMenuLink
                  className="[font-family:'Roboto',Helvetica] font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.name}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right - Plan Status, Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Plan Status */}
          <div className="flex items-center px-3 py-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-blue-800">{user?.plan || 'Pro Plan'}</span>
          </div>

          {/* Manage Plan Button */}
          <Button variant="outline" className="text-sm" onClick={handleManagePlan}>
            <Settings className="w-4 h-4 mr-2" />
            Manage Plan
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="px-4 py-2 rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-semibold">{user?.initials || 'U'}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-red-100">{user?.location || 'Location'}</p>
                </div>
                <ChevronDown className="w-4 h-4" />
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
        </div>
      </div>
    </header>
  );
};
