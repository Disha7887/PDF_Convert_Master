import React from "react";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroSection } from "./sections/HeroSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { APIDocumentationSection } from "./sections/APIDocumentationSection";

export const Body = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full relative overflow-x-hidden bg-white">
      {/* Main content sections — each renders its own animated background */}
      <HeroSection />
      <FeaturesSection />
      <APIDocumentationSection />
      <TestimonialsSection />
    </div>
  );
};
