import React from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export const NavigationSection = (): JSX.Element => {
  // Navigation menu items data
  const navItems = [
    { name: "Home", width: "w-[42.98px]" },
    { name: "Tools", width: "w-[38.66px]" },
    { name: "Pricing", width: "w-[50.38px]" },
    { name: "About", width: "w-[42.98px]" },
    { name: "Contact", width: "w-[56.12px]" },
  ];

  return (
    <header className="w-full h-[65px] bg-[#111726] border-b border-[#374050] shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]">
      <div className="max-w-screen-xl mx-auto px-8 h-16">
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
                  <NavigationMenuLink className="[font-family:'Roboto',Helvetica] font-medium text-[#d0d5da] text-base leading-6 whitespace-nowrap cursor-pointer">
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
              className="h-[42px] px-[17px] py-[9px] rounded-lg border border-[#4a5462] [font-family:'Roboto',Helvetica] font-medium text-[#d0d5da] text-base"
            >
              Log In
            </Button>
            <Button className="h-10 px-6 py-2 rounded-lg shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] bg-[linear-gradient(90deg,rgba(220,38,38,1)_0%,rgba(185,28,28,1)_100%)] [font-family:'Roboto',Helvetica] font-medium text-white text-base [text-shadow:0px_10px_15px_#0000001a]">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
