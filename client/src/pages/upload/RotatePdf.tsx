import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const RotatePdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="rotate-pdf"
      title="PDF Rotator"
      description="Rotate PDF pages clockwise or counterclockwise. Rotate all pages or select specific ones."
      acceptedFormats={[".pdf"]}
      maxFileSize="100MB"
      outputFormat="Rotated PDF"
      features={[
        "Rotate by 90°, 180°, 270°",
        "Select specific pages",
        "Batch rotation",
        "Preview before saving"
      ]}
    />
  );
};
