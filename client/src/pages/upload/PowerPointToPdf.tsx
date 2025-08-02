import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const PowerPointToPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="powerpoint-to-pdf"
      title="PowerPoint to PDF Converter"
      description="Convert your PowerPoint presentations (.ppt, .pptx) to PDF format with perfect slide layouts."
      acceptedFormats={[".ppt", ".pptx"]}
      maxFileSize="100MB"
      outputFormat="PDF"
      features={[
        "Preserves slide animations",
        "Maintains formatting and fonts",
        "High-resolution output",
        "Secure processing"
      ]}
    />
  );
};
