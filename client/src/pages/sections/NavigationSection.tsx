import React from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export const NavigationSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const { login } = useAuth();

  // Navigation menu items data
  const navItems: {
    name: string;
    width: string;
    href?: string;
    children?: { name: string; href: string }[];
  }[] = [
    { name: "Home", width: "w-[42.98px]", href: "/" },
    { name: "Tools", width: "w-[38.66px]", href: "/tools" },
    {
      name: "Image Editor",
      width: "w-auto",
      children: [
        { name: "Resize Image", href: "/image-editor/resize" },
        { name: "Crop Image", href: "/image-editor/crop" },
        { name: "Rotate Image", href: "/image-editor/rotate" },
      ],
    },
    { name: "Pricing", width: "w-[50.38px]", href: "/pricing" },
    { name: "About", width: "w-[42.98px]", href: "/about" },
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
    <header className="w-full h-[65px] bg-white border-b border-gray-200 shadow-[0px_1px_3px_0px_#0000000d,0px_1px_2px_-1px_#0000000d]">
      <div className="max-w-screen-xl mx-auto px-8 h-[65px]">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center h-7">
            <h1 className="font-['Poppins'] font-bold text-gray-900 text-xl leading-7 whitespace-nowrap">
              PDF Convert Master
            </h1>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="flex justify-center">
            <NavigationMenuList className="flex space-x-8">
              {navItems.map((item, index) => (
                <NavigationMenuItem key={index} className={item.width}>
                  {item.children ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors flex items-center gap-1 outline-none"
                          data-testid="nav-image-editor"
                        >
                          {item.name}
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        {item.children.map((child) => (
                          <DropdownMenuItem
                            key={child.href}
                            className="cursor-pointer"
                            onClick={() => handleNavClick(child.href)}
                            data-testid={`nav-${child.href.split("/").pop()}`}
                          >
                            {child.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <NavigationMenuLink
                      className="font-medium text-gray-600 text-base leading-6 whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => item.href && handleNavClick(item.href)}
                    >
                      {item.name}
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
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
        </div>
      </div>
    </header>
  );
};
