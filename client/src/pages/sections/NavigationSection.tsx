import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

export const NavigationSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation menu items data
  const navItems = [
    { name: "Home", width: "w-[42.98px]", href: "/" },
    { name: "Tools", width: "w-[38.66px]", href: "/tools" },
    { name: "Pricing", width: "w-[50.38px]", href: "/pricing" },
    { name: "About", width: "w-[42.98px]", href: "/about" },
    { name: "Support", width: "w-[56.12px]", href: "/support" },
    { name: "Contact", width: "w-[56.12px]", href: "/contact" },
    { name: "Dashboard", width: "w-[70px]", href: "/dashboard" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      setLocation(href);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to support page where search functionality is available
      setLocation(`/support`);
      console.log('Header search:', searchQuery);
      // Clear search after navigation
      setTimeout(() => setSearchQuery(''), 100);
    }
  };

  // Add keyboard shortcut for search (Ctrl/Cmd + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.header-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="w-full h-[65px] bg-[#111726] border-b border-[#374050] shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Logo */}
          <div className="flex items-center h-7">
            <h1 className="[font-family:'Pacifico',Helvetica] font-normal text-white text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="hidden lg:flex flex-1 justify-center">
            <NavigationMenuList className="flex space-x-6 xl:space-x-8">
              {navItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink
                    className="[font-family:'Roboto',Helvetica] font-medium text-[#d0d5da] text-sm xl:text-base leading-6 whitespace-nowrap cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar & Auth Section */}
          <div className="flex items-center space-x-4">
            {/* Professional Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="header-search-input w-[200px] xl:w-[240px] h-[38px] pl-10 pr-4 border border-gray-200 rounded-full text-gray-700 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300"
                  title="Press Ctrl+K to focus search"
                />
              </div>
            </form>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 text-[#d0d5da] hover:text-white hover:bg-[#374050] rounded-lg transition-colors"
              onClick={() => setLocation('/support')}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                className="h-[38px] sm:h-[42px] px-3 sm:px-[17px] py-[9px] rounded-lg border border-[#4a5462] [font-family:'Roboto',Helvetica] font-medium text-[#d0d5da] text-sm sm:text-base hover:bg-[#374050] hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">Log In</span>
                <span className="sm:hidden">Login</span>
              </Button>
              <Button className="h-[38px] sm:h-10 px-4 sm:px-6 py-2 rounded-lg shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] bg-[linear-gradient(90deg,rgba(220,38,38,1)_0%,rgba(185,28,28,1)_100%)] [font-family:'Roboto',Helvetica] font-medium text-white text-sm sm:text-base [text-shadow:0px_10px_15px_#0000001a] hover:shadow-[0px_15px_25px_-5px_#0000001a] transition-all duration-200">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
