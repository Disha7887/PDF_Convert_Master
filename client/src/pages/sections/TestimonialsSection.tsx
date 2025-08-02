import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AnimatedParticles } from "@/components/ui/animated-particles";

export const TestimonialsSection = (): JSX.Element => {
  // Feature data for mapping
  const features = [
    {
      id: 1,
      title: "Enterprise Security",
      description: [
        "Bank-grade encryption and compliance with",
        "GDPR, SOC 2, and ISO 27001 standards.",
      ],
      image: "/figmaAssets/img-422.png",
    },
    {
      id: 2,
      title: "Lightning Fast",
      description: [
        "Process documents in seconds with our",
        "optimized cloud infrastructure.",
      ],
      image: "/figmaAssets/img-432.png",
    },
    {
      id: 3,
      title: "Team Collaboration",
      description: [
        "Share and collaborate on PDF documents with",
        "your team members seamlessly.",
      ],
      image: "/figmaAssets/img-442.png",
    },
    {
      id: 4,
      title: "AI-Powered OCR",
      description: [
        "Advanced optical character recognition for",
        "scanned documents and images.",
      ],
      image: "/figmaAssets/img-452.png",
    },
    {
      id: 5,
      title: "Mobile Optimized",
      description: [
        "Access all tools from any device with our",
        "responsive web interface.",
      ],
      image: "/figmaAssets/img-462.png",
    },
    {
      id: 6,
      title: "Batch Processing",
      description: [
        "Handle multiple files simultaneously to boost",
        "your productivity.",
      ],
      image: "/figmaAssets/img-472.png",
    },
  ];

  return (
    <section className="w-full py-24 bg-[#111726] relative">
      {/* Animated particles background */}
      <AnimatedParticles count={20} />

      <img
        className="absolute w-full max-w-[1368px] h-auto top-[121px] left-1/2 -translate-x-1/2"
        alt="Background decoration"
        src="/figmaAssets/div-382.svg"
      />

      <div className="max-w-screen-xl mx-auto px-8 relative z-10">
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-4xl font-bold text-white text-center leading-10 mb-4">
            Everything You Need for PDF Success
          </h2>
          <p className="text-xl text-[#d0d5da] text-center max-w-screen-md">
            Powerful features, seamless integrations, and enterprise-grade
            security - all in one platform
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Tabs defaultValue="features" className="w-full max-w-[445px]">
            <TabsList className="w-full h-[67px] p-[9px] bg-[#ffffff1a] rounded-full border border-[#ffffff33] shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] backdrop-blur-[2px]">
              <TabsTrigger
                value="features"
                className="w-[135px] h-[49px] rounded-full data-[state=active]:bg-[linear-gradient(90deg,rgba(220,38,38,1)_0%,rgba(185,28,28,1)_100%)] data-[state=active]:text-white data-[state=active]:shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] font-semibold"
              >
                Features
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="w-[160px] h-[49px] rounded-full font-semibold text-[#d0d5da]"
              >
                Integrations
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-[132px] h-[49px] rounded-full font-semibold text-[#d0d5da]"
              >
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => (
                  <Card key={feature.id} className="bg-transparent border-0">
                    <div className="flex flex-col items-center p-0">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden">
                          <img
                            className="w-16 h-16 object-cover"
                            alt={feature.title}
                            src={feature.image}
                          />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white text-center mb-2">
                        {feature.title}
                      </h3>
                      <div className="text-[#d0d5da] text-base text-center leading-[26px]">
                        {feature.description.map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="integrations">
              {/* Content for Integrations tab would go here */}
            </TabsContent>

            <TabsContent value="security">
              {/* Content for Security tab would go here */}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col items-center mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            Ready to Transform Your PDF Workflow?
          </h3>
          <p className="text-base text-[#d0d5da] text-center mb-8">
            Join millions of users who trust our platform for their document
            needs
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="font-semibold px-8 py-4 h-[59px] rounded-lg">
              Get Started Free
            </Button>
            <Button
              variant="outline"
              className="bg-[#ffffff1a] text-white border-[#ffffff33] font-semibold px-8 py-4 h-[59px] rounded-lg"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
