import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { RefreshCw } from "lucide-react";

export const ConvertImageFormatUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="convert-image-format"
        toolTitle="Image Format Converter"
        toolDescription="Convert between popular image formats: JPG, PNG, WebP, GIF, BMP, TIFF. Optimize for web or print with quality settings."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]}
        maxFileSize="25MB"
        outputFormat="JPG, PNG, WebP, etc."
        toolIcon={<RefreshCw className="w-8 h-8 text-indigo-500" />}
        iconBg="bg-indigo-50 border-indigo-200 dark:bg-indigo-900 dark:border-indigo-800"
      />
    </div>
  );
};