import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const PdfToImagesUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="pdf-to-images"
      title="PDF to Images Converter"
      description="Convert PDF pages to high-quality image files (JPG, PNG). Each page becomes a separate image."
      acceptedFormats={[".pdf"]}
      maxFileSize="50MB"
      outputFormat="JPG/PNG"
      features={[
        "High-resolution output",
        "Multiple format options",
        "Batch conversion",
        "Customizable DPI settings"
      ]}
    />
  );
};
