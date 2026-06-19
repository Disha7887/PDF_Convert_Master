import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { RotateCw } from "lucide-react";

export const RotateImageUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="rotate-image"
        toolTitle="Image Rotator"
        toolDescription="Rotate images by any angle. Quick 90° rotations or custom angle rotation with automatic background fill and quality preservation."
        acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
        maxFileSize="20MB"
        outputFormat="Same Format"
        toolIcon={<RotateCw className="w-8 h-8 text-pink-500" />}
        iconBg="bg-pink-50 border-pink-200 dark:bg-pink-900 dark:border-pink-800"
      />
    </div>
  );
};