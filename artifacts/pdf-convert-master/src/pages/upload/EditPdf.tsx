import React from "react";
import { PdfEditor } from "@/components/PdfEditor";
import { AnimatedBackground } from "@/components/ui/animated-background";

export const EditPdfUpload: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white py-8">
      <AnimatedBackground particleCount={14} className="opacity-50" />
      <div className="relative z-10">
        <PdfEditor />
      </div>
    </div>
  );
};
