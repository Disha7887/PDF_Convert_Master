import React from "react";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";

export const Body = (): JSX.Element => {
  // Background decorative elements data
  const backgroundCircles = [
    {
      className:
        "w-96 h-96 top-[51px] left-36 rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(239,68,68,0.1)_0%,rgba(249,115,22,0.1)_100%)]",
    },
    {
      className:
        "w-80 h-80 top-[410px] left-[904px] rounded-full blur-[20px] bg-[linear-gradient(135deg,rgba(59,130,246,0.15)_0%,rgba(168,85,247,0.15)_100%)]",
    },
    {
      className:
        "w-56 h-56 top-[390px] left-[856px] rounded-full blur-[20px] bg-[linear-gradient(135deg,rgba(249,115,22,0.1)_0%,rgba(239,68,68,0.1)_100%)]",
    },
  ];

  const backgroundDots = [
    { className: "w-4 h-4 top-[102px] left-72 bg-[#ffffff33] rounded-full" },
    {
      className: "w-3 h-3 top-[307px] left-[996px] bg-[#f770704c] rounded-full",
    },
    {
      className: "w-2 h-2 top-[760px] left-[216px] bg-[#60a5fa66] rounded-full",
    },
    {
      className:
        "w-5 h-5 top-[717px] left-[1276px] bg-[#4ade8040] rounded-full",
    },
    {
      className:
        "w-3 h-3 top-[858px] left-[1140px] bg-[#bf83fb59] rounded-full",
    },
    {
      className:
        "w-4 h-4 top-[512px] left-[1008px] bg-[#fa913c4c] rounded-full",
    },
  ];

  const backgroundLines = [
    {
      className:
        "w-px h-32 top-[205px] left-[360px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(255,255,255,0.2)_50%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "w-px h-24 top-[614px] left-[935px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(248,113,113,0.3)_50%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "w-px h-28 top-[605px] left-[864px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(96,165,250,0.25)_50%,rgba(0,0,0,0)_100%)]",
    },
  ];

  return (
    <div className="flex flex-col w-full relative overflow-x-hidden bg-[#111726]">
      {/* Indicator line at the top */}
      <div className="absolute w-[130px] h-1 top-0 left-0 bg-red-500" />

      {/* Main content sections */}
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />

      {/* Background decorative elements */}
      <div className="absolute w-full h-[1024px] top-[359px] left-0 right-0 mx-auto max-w-[1440px] pointer-events-none">
        {/* Background gradient circles */}
        {backgroundCircles.map((circle, index) => (
          <div
            key={`circle-${index}`}
            className={`absolute ${circle.className}`}
          />
        ))}

        {/* Background dots */}
        {backgroundDots.map((dot, index) => (
          <div key={`dot-${index}`} className={`absolute ${dot.className}`} />
        ))}

        {/* Background lines */}
        {backgroundLines.map((line, index) => (
          <div key={`line-${index}`} className={`absolute ${line.className}`} />
        ))}
      </div>
    </div>
  );
};
