import React from "react";
import { Button } from "@/components/ui/button";
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

export const NavigationSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const { login } = useAuth();

  // Simple (non-dropdown) navigation links; the tool categories render as dropdowns
  const leadingItem = { name: "Home", href: "/" };
  const trailingItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      setLocation(href);
    }
  };

  // Remove direct login functionality from navigation, redirect to sign-in page instead

  const handleGetStarted = () => {
    // Redirect to signup page
    setLocation('/signup');
  };

  return (
    <header className="relative z-50 w-full h-[65px] bg-white border-b border-gray-200 shadow-[0px_1px_3px_0px_#0000000d,0px_1px_2px_-1px_#0000000d]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-[65px]">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center h-7">
            <h1 className="font-['Poppins'] font-bold text-gray-900 text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="hidden lg:flex justify-center">
            <NavigationMenuList className="flex items-center space-x-8">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors"
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
                    className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => handleNavClick(item.href)}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons (desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            <ToolSearch />
            <Button
              variant="outline"
              className="h-[42px] px-[17px] py-[9px] rounded-lg border border-gray-300 font-medium !text-gray-700 text-base hover:!text-gray-900 hover:bg-gray-50 transition-colors bg-white"
              onClick={() => setLocation('/signin')}
            >
              Log In
            </Button>
            <Button
              className="h-10 px-6 py-2 rounded-full font-medium text-base [text-shadow:0px_10px_15px_#0000001a]"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <MobileNav
              homeItem={leadingItem}
              trailingItems={trailingItems}
              footer={(close) => (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full h-[42px] rounded-lg border border-gray-300 font-medium !text-gray-700 text-base hover:!text-gray-900 hover:bg-gray-50 transition-colors bg-white"
                    onClick={() => {
                      setLocation('/signin');
                      close();
                    }}
                    data-testid="mobile-button-login"
                  >
                    Log In
                  </Button>
                  <Button
                    className="w-full h-10 rounded-full font-medium text-base"
                    onClick={() => {
                      handleGetStarted();
                      close();
                    }}
                    data-testid="mobile-button-get-started"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
