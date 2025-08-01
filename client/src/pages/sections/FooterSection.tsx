import { CloudIcon, LockIcon, PhoneIcon, ShieldIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export const FooterSection = (): JSX.Element => {
  const [, setLocation] = useLocation();

  // Footer links data
  const quickLinks = [
    { text: "PDF Tools", path: "/tools" },
    { text: "Pricing", path: "/pricing" },
    { text: "About Us", path: "/about" },
    { text: "Support", path: "/contact" },
    { text: "Contact", path: "/contact" },
  ];

  const companyLinks = [
    { text: "Privacy Policy", path: null },
    { text: "Terms of Service", path: "/terms-of-service" },
    { text: "Support", path: "/contact" },
    { text: "Report Bug", path: null },
  ];

  // Footer bottom info items
  const footerInfoItems = [
    { icon: <PhoneIcon className="w-[14.59px] h-5" />, text: "+447429919748" },
    { icon: <LockIcon className="w-[14.59px] h-5" />, text: "SSL Secured" },
    {
      icon: <CloudIcon className="w-[14.59px] h-5" />,
      text: "CloudIcon Processing",
    },
    {
      icon: <ShieldIcon className="w-[14.59px] h-5" />,
      text: "Privacy Protected",
    },
  ];

  return (
    <footer className="flex flex-col w-full items-start bg-[#111726] border-t border-[#374050]">
      <div className="flex items-start px-20 py-0 w-full">
        <div className="flex flex-col max-w-screen-xl w-full items-start px-8 py-12">
          <div className="flex flex-wrap w-full items-start gap-8">
            {/* Brand Column */}
            <div className="flex flex-col w-[280px] items-start">
              <div className="flex w-full h-7 items-center">
                <div className="w-fit [font-family:'Pacifico',Helvetica] font-normal text-white text-xl leading-7 whitespace-nowrap">
                  PDF Convert Master
                </div>
              </div>

              <div className="pt-4">
                <div className="w-[280px] [font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-[22.8px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
                  Your trusted partner for professional PDF conversion and
                  document management solutions.
                </div>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="flex flex-col w-[280px] items-start">
              <div className="pb-4">
                <div className="w-full h-6 items-center">
                  <div className="w-fit [font-family:'Roboto',Helvetica] font-semibold text-white text-base leading-6 whitespace-nowrap">
                    Quick Links
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {quickLinks.map((link, index) => (
                  <div
                    key={`quick-link-${index}`}
                    className="flex items-center"
                  >
                    <div
                      className="w-fit [font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-5 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                      onClick={() => link.path && setLocation(link.path)}
                    >
                      {link.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Column */}
            <div className="flex flex-col w-[280px] items-start">
              <div className="pb-4">
                <div className="w-full h-7 items-center">
                  <div className="w-fit [font-family:'Roboto',Helvetica] font-semibold text-white text-lg leading-7 whitespace-nowrap">
                    Company
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {companyLinks.map((link, index) => (
                  <div
                    key={`company-link-${index}`}
                    className="flex items-center"
                  >
                    <div className="w-fit [font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-5 whitespace-nowrap cursor-pointer hover:text-white transition-colors">
                      {link.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Column */}
            <div className="flex flex-col w-[280px] items-start">
              <div className="pb-4">
                <div className="w-full h-7 items-center">
                  <div className="w-fit [font-family:'Roboto',Helvetica] font-semibold text-white text-lg leading-7 whitespace-nowrap">
                    Newsletter
                  </div>
                </div>
              </div>

              <div className="pb-4">
                <div className="w-[280px] [font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-[22.8px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                  Stay updated with our latest features and news.
                </div>
              </div>

              <div className="flex flex-col w-[280px] space-y-3">
                <Input
                  className="h-[38px] bg-gray-800 text-white border-[#4a5462] placeholder:text-[#9ca2af] [font-family:'Inter',Helvetica] font-medium text-sm"
                  placeholder="Enter your email"
                />
                <Button className="w-full h-9 bg-red-600 hover:bg-red-700 [font-family:'Roboto',Helvetica] font-medium text-white text-sm text-center">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 w-full">
            <div className="flex flex-col w-full pt-[33px] border-t border-[#374050]">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="[font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-5 whitespace-nowrap">
                    2024 PDF Convert Master by Mizan Store Ltd. All rights
                    reserved.
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {footerInfoItems.map((item, index) => (
                    <div
                      key={`info-item-${index}`}
                      className="flex items-center"
                    >
                      {item.icon}
                      <span className="ml-1 [font-family:'Roboto',Helvetica] font-normal text-[#9ca2af] text-sm leading-5 whitespace-nowrap">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
