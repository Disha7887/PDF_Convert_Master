import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { TrendingUp } from "lucide-react";

export const UpscaleImageUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="upscale-image"
        toolTitle="AI Image Upscaler"
        toolDescription="Enhance image resolution using AI technology. Increase image size up to 4x while maintaining sharpness, detail, and quality."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
        maxFileSize="10MB"
        outputFormat="High-res Images"
        toolIcon={<TrendingUp className="w-8 h-8 text-emerald-500" />}
        iconBg="bg-emerald-50 border-emerald-200 dark:bg-emerald-900 dark:border-emerald-800"
      />
    </div>
  );
};