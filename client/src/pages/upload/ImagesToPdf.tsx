import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Image } from "lucide-react";

export const ImagesToPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="images-to-pdf"
        toolTitle="Images to PDF Converter"
        toolDescription="Combine multiple images (JPG, PNG, GIF, WebP) into a single PDF document with customizable page layouts and ordering."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
        maxFileSize="20MB"
        outputFormat="PDF"
        toolIcon={<Image className="w-8 h-8 text-purple-500" />}
        iconBg="bg-purple-50 border-purple-200 dark:bg-purple-900 dark:border-purple-800"
      />
    </div>
  );
};