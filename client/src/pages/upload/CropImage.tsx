import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Crop } from "lucide-react";

export const CropImageUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="crop-image"
        toolTitle="Image Cropper"
        toolDescription="Crop images to remove unwanted areas. Use preset aspect ratios or freeform cropping with live preview and precise control."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
        maxFileSize="20MB"
        outputFormat="Same Format"
        toolIcon={<Crop className="w-8 h-8 text-amber-500" />}
        iconBg="bg-amber-50 border-amber-200 dark:bg-amber-900 dark:border-amber-800"
      />
    </div>
  );
};