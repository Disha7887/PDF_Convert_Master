import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const RemoveBackgroundUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="remove-background"
      title="Background Remover"
      description="Remove image backgrounds automatically using AI. Perfect for product photos, portraits, and graphic design."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
      maxFileSize="15MB"
      outputFormat="PNG with transparency"
      features={[
        "AI-powered detection",
        "Automatic processing",
        "High-quality edges",
        "Transparent background"
      ]}
    />
  );
};
