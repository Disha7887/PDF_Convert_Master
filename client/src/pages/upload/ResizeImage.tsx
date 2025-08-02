import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Maximize2 } from "lucide-react";

export const ResizeImageUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="resize-image"
        toolTitle="Image Resizer"
        toolDescription="Resize images to custom dimensions, percentage scaling, or preset sizes. Maintain aspect ratio or stretch to fit your needs."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
        maxFileSize="20MB"
        outputFormat="Same or Convert"
        toolIcon={<Maximize2 className="w-8 h-8 text-teal-500" />}
        iconBg="bg-teal-50 border-teal-200 dark:bg-teal-900 dark:border-teal-800"
      />
    </div>
  );
};