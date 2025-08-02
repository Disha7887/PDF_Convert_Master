import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedParticles } from "@/components/ui/animated-particles";
import { useLocation } from "wouter";
import { ArrowRightLeft, Layers, Shield } from "lucide-react";

export const FeaturesSection = (): JSX.Element => {
  // Add CSS keyframes for the rotating border animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotateBorder {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [location, setLocation] = useLocation();

  // Stats data for the metrics section
  const stats = [
    { value: "10M+", label: "Active Users" },
    { value: "100M+", label: "Files Processed" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
  ];

  // Feature cards data
  const featureCards = [
    {
      title: "Convert",
      IconComponent: ArrowRightLeft,
      description:
        "Transform your documents between different formats with perfect quality preservation.",
      features: ["PDF to Word", "Word to PDF", "Excel to PDF", "Image to PDF"],
      borderColor: "border-red-500/30",
      iconColor: "#ef4444",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Organize",
      IconComponent: Layers,
      description:
        "Merge, split, and reorganize your PDF documents with powerful editing tools.",
      features: ["Merge PDFs", "Split PDFs", "Compress Files", "Rotate Pages"],
      borderColor: "border-blue-500/30",
      iconColor: "#3b82f6",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Secure",
      IconComponent: Shield,
      description:
        "Protect your documents with advanced security features and encryption.",
      features: [
        "Password Protect",
        "Remove Password",
        "Add Watermark",
        "Digital Signature",
      ],
      borderColor: "border-emerald-500/30",
      iconColor: "#10b981",
      bgColor: "bg-emerald-500/10",
    },
  ];

  // Key features with icons
  const keyFeatures = [
    {
      title: "Lightning Fast Processing",
      description: "Convert and process documents in seconds, not minutes",
      icon: "/figmaAssets/margin-wrap-11.svg",
    },
    {
      title: "Enterprise-Grade Security",
      description: "Your documents are encrypted and processed securely",
      icon: "/figmaAssets/margin-wrap-11.svg",
    },
    {
      title: "Cross-Platform Compatibility",
      description: "Works seamlessly across all devices and operating systems",
      icon: "/figmaAssets/margin-wrap-11.svg",
    },
  ];

  // Format options for the converter UI
  const formatOptions = [
    {
      name: "Word",
      icon: "/figmaAssets/inline-center-wrap.svg",
    },
    {
      name: "Excel",
      icon: "/figmaAssets/inline-center-wrap-1.svg",
    },
    {
      name: "Image",
      icon: "/figmaAssets/inline-center-wrap-2.svg",
    },
  ];

  return (
    <section className="relative w-full py-24 bg-[#111726]">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated particles background */}
        <AnimatedParticles count={25} />

        <div className="absolute w-96 h-96 top-[84px] left-36 rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(239,68,68,0.1)_0%,rgba(249,115,22,0.1)_100%)]" />
        <div className="absolute w-80 h-80 top-[675px] left-[904px] rounded-full blur-[20px] bg-[linear-gradient(135deg,rgba(59,130,246,0.15)_0%,rgba(168,85,247,0.15)_100%)]" />
        <div className="absolute w-56 h-56 top-[789px] left-[856px] rounded-full blur-[20px] bg-[linear-gradient(135deg,rgba(249,115,22,0.1)_0%,rgba(239,68,68,0.1)_100%)]" />

        {/* Decorative dots */}
        <div className="absolute w-4 h-4 top-[169px] left-72 bg-[#ffffff33] rounded-full" />
        <div className="absolute w-3 h-3 top-[506px] left-[996px] bg-[#f770704c] rounded-full" />
        <div className="absolute w-2 h-2 top-[1258px] left-[216px] bg-[#60a5fa66] rounded-full" />
        <div className="absolute w-5 h-5 top-[1181px] left-[1276px] bg-[#4ade8040] rounded-full" />
        <div className="absolute w-3 h-3 top-[1423px] left-[1140px] bg-[#bf83fb59] rounded-full" />
        <div className="absolute w-4 h-4 top-[844px] left-[1008px] bg-[#fa913c4c] rounded-full" />

        {/* Decorative lines */}
        <div className="absolute w-px h-32 top-[338px] left-[360px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(255,255,255,0.2)_50%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute w-px h-24 top-[1013px] left-[935px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(248,113,113,0.3)_50%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute w-px h-28 top-[1069px] left-[864px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(96,165,250,0.25)_50%,rgba(0,0,0,0)_100%)]" />
      </div>

      <div className="max-w-screen-xl mx-auto px-8">
        {/* Section Header */}
        <div className="mb-20 text-center">
          <h2 className="text-5xl font-bold text-white mb-6 font-['Roboto',Helvetica] leading-[48px]">
            Transform Your PDF Workflow
          </h2>
          <p className="text-xl text-[#d0d5da] max-w-screen-md mx-auto font-['Roboto',Helvetica] leading-[32.5px]">
            Discover how millions of users worldwide are revolutionizing their
            document management with our powerful PDF tools
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-wrap gap-16 mb-20 items-center">
          {/* Left Column - Features */}
          <div className="flex-1 min-w-[300px]">
            {/* Performance Badge */}
            <Badge className="px-[17px] py-[9px] text-sm font-medium text-red-300 bg-[#ef444433] border-[#f770704c] rounded-full mb-6 h-[38px] font-['Roboto',Helvetica]">
              Industry Leading Performance
            </Badge>

            {/* Main Heading */}
            <h3 className="text-4xl font-bold text-white mb-6 leading-[45px] font-['Roboto',Helvetica]">
              Professional PDF Tools Built for Modern Workflows
            </h3>

            {/* Description */}
            <p className="text-lg text-[#d0d5da] mb-8 leading-[29.2px] font-['Roboto',Helvetica]">
              From converting documents to merging files, our comprehensive
              suite of PDF tools handles every aspect of your document workflow
              with precision and speed.
            </p>

            {/* Key Features List */}
            <div className="mb-8">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start mb-4">
                  <img src={feature.icon} alt="" className="flex-shrink-0" />
                  <div className="ml-4">
                    <h4 className="text-base font-semibold text-white mb-1 font-['Roboto',Helvetica]">
                      {feature.title}
                    </h4>
                    <p className="text-base text-[#d0d5da] font-['Roboto',Helvetica]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4">
              <Button
                className="font-semibold px-8 py-4 h-[59px] rounded-lg shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] font-['Roboto',Helvetica]"
                onClick={() => {
                  console.log('Learn More button clicked');
                  setLocation('/learn-more');
                }}
              >
                <img
                  src="/figmaAssets/margin-wrap-8.svg"
                  alt=""
                  className="mr-2"
                />
                Learn More...
              </Button>
              <Button
                variant="outline"
                className="bg-[#ffffff1a] text-white border-[#ffffff33] font-semibold px-8 py-4 h-[59px] rounded-lg backdrop-blur-[2px] font-['Roboto',Helvetica]"
              >
                <img
                  src="/figmaAssets/margin-wrap-5.svg"
                  alt=""
                  className="mr-2"
                />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Column - UI Preview */}
          <div className="flex-1 min-w-[300px]">
            <div className="rounded-3xl border border-[#ffffff33] p-[33px] backdrop-blur-[2px] bg-[linear-gradient(151deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.05)_100%)] shadow-[0px_25px_50px_-12px_#00000040]">
              <div className="bg-[#ffffffe6] rounded-2xl p-6 shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] backdrop-blur-[2px]">
                {/* Browser Controls */}
                <div className="flex items-center mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full ml-3"></div>
                  <div className="w-3 h-3 bg-[#21c45d] rounded-full ml-3"></div>
                  <div className="flex-1 ml-3 bg-[#f2f4f5] rounded-full px-4 py-2">
                    <span className="text-sm text-[#4a5462] font-['Roboto',Helvetica]">
                      PDF Converter Pro
                    </span>
                  </div>
                </div>

                {/* File Drop Area */}
                <div className="border-2 border-dashed border-red-200 rounded-xl p-[26px] flex flex-col items-center mb-4">
                  <img
                    src="/figmaAssets/margin-wrap-30.svg"
                    alt=""
                    className="mb-2"
                  />
                  <p className="text-sm text-[#4a5462] text-center mb-2 font-['Roboto',Helvetica]">
                    Drop your files here
                  </p>
                  <Button className="text-sm px-4 py-2 rounded-lg font-['Roboto',Helvetica]">
                    Browse Files
                  </Button>
                </div>

                {/* Format Options */}
                <div className="flex flex-wrap gap-3">
                  {formatOptions.map((format, index) => (
                    <div
                      key={index}
                      className="flex-1 min-w-[120px] bg-[#f9fafa] rounded-lg p-3 flex flex-col items-center"
                    >
                      <img
                        src={format.icon}
                        alt={format.name}
                        className="w-full mb-2"
                      />
                      <span className="text-xs text-[#4a5462] text-center font-['Roboto',Helvetica]">
                        {format.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-20 bg-[#ffffff0d] rounded-3xl border border-[#ffffff1a] backdrop-blur-[2px] p-12">
          <div className="flex flex-wrap justify-between">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center w-full sm:w-1/2 md:w-1/4 mb-4 md:mb-0"
              >
                <p className="text-4xl font-bold text-red-400 mb-2 font-['Roboto',Helvetica]">
                  {stat.value}
                </p>
                <p className="text-base text-[#d0d5da] font-['Roboto',Helvetica]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featureCards.map((card, index) => {
            const { IconComponent } = card;
            return (
              <div key={index} className="relative group h-full">
                {/* Animated border container */}
                <div className="absolute inset-0 rounded-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-300">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 340deg, ${card.iconColor}80 360deg)`,
                      animation: 'rotateBorder 3.5s linear infinite',
                      padding: '2px'
                    }}
                  >
                    <div className="w-full h-full bg-[#111726] rounded-2xl" />
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `conic-gradient(from 120deg, transparent 340deg, ${card.iconColor}60 360deg)`,
                      animation: 'rotateBorder 3.5s linear infinite reverse',
                      padding: '2px'
                    }}
                  >
                    <div className="w-full h-full bg-transparent rounded-2xl" />
                  </div>
                </div>

                <Card
                  className={`relative bg-[#ffffff0d] rounded-2xl backdrop-blur-[2px] border ${card.borderColor} hover:${card.borderColor.replace('/30', '/50')} transition-all duration-300 z-10 h-full flex flex-col`}
                >
                  <div className="p-6 lg:p-8 flex flex-col h-full">
                    {/* Icon Container */}
                    <div className="flex justify-center mb-6">
                      <div className={`w-20 h-20 ${card.bgColor} rounded-2xl flex items-center justify-center`}>
                        <IconComponent
                          size={40}
                          style={{ color: card.iconColor }}
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-2xl font-bold text-white mb-4 text-center font-['Roboto',Helvetica]">
                        {card.title}
                      </h3>
                      <p className="text-base text-[#d0d5da] mb-6 text-center leading-relaxed font-['Roboto',Helvetica] flex-grow">
                        {card.description}
                      </p>

                      {/* Features List */}
                      <ul className="space-y-3">
                        {card.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center text-sm text-[#9ca2af] font-['Roboto',Helvetica]"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: card.iconColor }}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
