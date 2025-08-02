import { CloudIcon, LockIcon, PhoneIcon, ShieldIcon, MapPin, Mail, Facebook, Instagram, Linkedin } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export const FooterSection = (): JSX.Element => {
  const [, setLocation] = useLocation();

  // Enhanced navigation handler with better error handling
  const handleNavigation = (path: string | null, linkText: string) => {
    console.log(`🔗 Footer link clicked: ${linkText}`, { path });

    if (!path) {
      console.log(`❌ No path defined for: ${linkText}`);
      return;
    }

    try {
      console.log(`🚀 Navigating to: ${path}`);
      setLocation(path);

      // Scroll to top after a short delay to ensure page loads
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      console.log(`✅ Navigation to ${path} initiated successfully`);
    } catch (error) {
      console.error(`❌ Navigation error for ${path}:`, error);
      // Fallback: try direct window navigation
      try {
        window.location.href = path;
      } catch (fallbackError) {
        console.error(`❌ Fallback navigation failed:`, fallbackError);
      }
    }
  };

  // Footer links data
  const quickLinks = [
    { text: "PDF Tools", path: "/tools" },
    { text: "Pricing", path: "/pricing" },
    { text: "About Us", path: "/about" },
    { text: "Support", path: "/support" },
    { text: "Contact", path: "/contact" },
  ];

  const companyLinks = [
    { text: "Privacy Policy", path: "/privacy-policy" },
    { text: "Terms of Service", path: "/terms-of-service" },
    { text: "Support", path: "/support" },
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
    <footer className="bg-[#111726] border-t border-[#374050] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Company Info Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-4 font-['Pacifico',Helvetica]">
                PDF Convert Master
              </h3>
              <p className="text-[#9ca2af] text-sm leading-relaxed">
                Your trusted partner for professional PDF conversion and document management solutions.
              </p>
            </div>

            {/* Company Details */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Mizan Store Ltd</h4>

              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#9ca2af] mt-0.5 flex-shrink-0" />
                <div className="text-[#9ca2af] text-sm">
                  <p>123 Business Street</p>
                  <p>London, SW1A 1AA</p>
                  <p>United Kingdom</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <PhoneIcon className="w-4 h-4 text-[#9ca2af] flex-shrink-0" />
                <span className="text-[#9ca2af] text-sm">+447429919748</span>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#9ca2af] flex-shrink-0" />
                <span className="text-[#9ca2af] text-sm">info@pdfconvertmaster.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Quick Links</h4>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <button
                  key={`quick-link-${index}`}
                  className="block text-[#9ca2af] text-sm hover:text-white transition-colors duration-200 text-left"
                  onClick={() => handleNavigation(link.path, link.text)}
                  type="button"
                >
                  {link.text}
                </button>
              ))}
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Legal & Support</h4>
            <div className="space-y-3">
              {companyLinks.map((link, index) => (
                <button
                  key={`company-link-${index}`}
                  className={`block text-[#9ca2af] text-sm transition-colors duration-200 text-left ${
                    link.path ? 'hover:text-white cursor-pointer' : 'opacity-50 cursor-default'
                  }`}
                  onClick={() => handleNavigation(link.path, link.text)}
                  disabled={!link.path}
                  type="button"
                >
                  {link.text}
                </button>
              ))}
            </div>
          </div>

          {/* Newsletter & Social Column */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Stay Connected</h4>

            <div className="mb-6">
              <p className="text-[#9ca2af] text-sm mb-4">
                Subscribe to our newsletter for updates and news.
              </p>
              <div className="space-y-3">
                <Input
                  className="bg-gray-800 text-white border-[#4a5462] placeholder:text-[#9ca2af] text-sm"
                  placeholder="Enter your email"
                />
                <Button className="w-full text-sm">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h5 className="text-white font-medium text-sm mb-3">Follow Us</h5>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#9ca2af] hover:bg-blue-600 hover:text-white transition-all duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#9ca2af] hover:bg-pink-600 hover:text-white transition-all duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#9ca2af] hover:bg-blue-700 hover:text-white transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-[#374050]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">

            {/* Copyright */}
            <div className="text-[#9ca2af] text-sm">
              © {new Date().getFullYear()} PDF Convert Master by Mizan Store Ltd. All rights reserved.
            </div>

            {/* Security Features */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {footerInfoItems.map((item, index) => (
                <div
                  key={`info-item-${index}`}
                  className="flex items-center space-x-2"
                >
                  {item.icon}
                  <span className="text-[#9ca2af] text-sm whitespace-nowrap">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
