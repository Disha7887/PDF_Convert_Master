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

export const NavigationSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const { login } = useAuth();

  // Navigation menu items data
  const navItems = [
    { name: "Home", width: "w-[42.98px]", href: "/" },
    { name: "Tools", width: "w-[38.66px]", href: "/tools" },
    { name: "Pricing", width: "w-[50.38px]", href: "/pricing" },
    { name: "About", width: "w-[42.98px]", href: "/about" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      setLocation(href);
    }
  };

  // Simulated login function (replace with real authentication)
  const handleLogin = () => {
    const mandaUser = {
      id: 'manda_onzale_001',
      name: 'Manda Onzale',
      email: 'manda@example.com',
      location: 'London, UK',
      initials: 'MO',
      plan: 'Pro Plan'
    };

    login(mandaUser);
    console.log('User logged in successfully');
  };

  const handleGetStarted = () => {
    // Redirect to signup page
    setLocation('/signup');
  };

  return (
    <header className="w-full h-[65px] bg-[#111726] border-b border-[#374050] shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]">
      <div className="max-w-screen-xl mx-auto px-8 h-[65px]">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center h-7">
            <h1 className="[font-family:'Pacifico',Helvetica] font-normal text-white text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="flex justify-center">
            <NavigationMenuList className="flex space-x-8">
              {navItems.map((item, index) => (
                <NavigationMenuItem key={index} className={item.width}>
                  <NavigationMenuLink
                    className="[font-family:'Roboto',Helvetica] font-medium text-[#d0d5da] text-base leading-6 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="h-[42px] px-[17px] py-[9px] rounded-lg border border-[#4a5462] [font-family:'Roboto',Helvetica] font-medium !text-white text-base hover:!text-white hover:bg-[#4a5462] transition-colors bg-transparent"
              onClick={() => setLocation('/signin')}
            >
              Log In
            </Button>
            <Button
              className="h-10 px-6 py-2 rounded-lg [font-family:'Roboto',Helvetica] font-medium text-base [text-shadow:0px_10px_15px_#0000001a]"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
