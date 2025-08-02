import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const UpscaleImageUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="upscale-image"
      title="Image Upscaler"
      description="Enhance image resolution using AI technology. Increase image size up to 4x while maintaining sharpness and detail."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
      maxFileSize="10MB"
      outputFormat="High-resolution images"
      features={[
        "AI-powered upscaling",
        "2x, 3x, 4x enlargement",
        "Preserves image quality",
        "Edge enhancement"
      ]}
    />
  );
};
