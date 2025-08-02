import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const ConvertImageFormatUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="convert-image-format"
      title="Image Format Converter"
      description="Convert between image formats: JPG, PNG, WebP, GIF, BMP. Optimize for web or print with quality settings."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]}
      maxFileSize="25MB"
      outputFormat="JPG, PNG, WebP, GIF, BMP"
      features={[
        "Multiple format support",
        "Quality adjustment",
        "Batch conversion",
        "Web optimization"
      ]}
    />
  );
};
