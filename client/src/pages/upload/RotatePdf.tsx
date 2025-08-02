import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { RotateCw } from "lucide-react";

export const RotatePdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="rotate-pdf"
        toolTitle="PDF Rotator"
        toolDescription="Rotate PDF pages clockwise or counterclockwise by 90°, 180°, or 270°. Rotate all pages or select specific ones with preview."
        acceptedFormats={[".pdf"]}
        maxFileSize="100MB"
        outputFormat="Rotated PDF"
        toolIcon={<RotateCw className="w-8 h-8 text-purple-600" />}
        iconBg="bg-purple-50 border-purple-200 dark:bg-purple-900 dark:border-purple-800"
      />
    </div>
  );
};