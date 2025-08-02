import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const ImagesToPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="images-to-pdf"
      title="Images to PDF Converter"
      description="Combine multiple images (JPG, PNG, GIF, BMP) into a single PDF document with customizable page layouts."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
      maxFileSize="20MB per image"
      outputFormat="PDF"
      multiple={true}
      features={[
        "Multiple image formats supported",
        "Drag & drop reordering",
        "Page size optimization",
        "Compression options"
      ]}
    />
  );
};
