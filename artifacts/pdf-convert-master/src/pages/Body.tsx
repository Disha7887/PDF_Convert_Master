import React from "react";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { APIDocumentationSection } from "./sections/APIDocumentationSection";

export const Body = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full relative overflow-x-hidden bg-white">
      {/* Indicator line at the top */}
      <div className="absolute w-[130px] h-1 top-0 left-0 bg-blue-500 z-20" />

      {/* Main content sections — each renders its own animated background */}
      <HeroSection />
      <FeaturesSection />
      <APIDocumentationSection />
      <TestimonialsSection />
    </div>
  );
};
