import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const ResizeImageUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="resize-image"
      title="Image Resizer"
      description="Resize images to custom dimensions, percentage, or preset sizes. Maintain aspect ratio or stretch to fit."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
      maxFileSize="20MB"
      outputFormat="Same format or convert"
      features={[
        "Custom width & height",
        "Percentage scaling",
        "Preset sizes available",
        "Maintain aspect ratio option"
      ]}
    />
  );
};
