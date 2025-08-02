import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const CompressPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="compress-pdf"
      title="PDF Compressor"
      description="Reduce PDF file size while maintaining document quality. Choose from different compression levels."
      acceptedFormats={[".pdf"]}
      maxFileSize="200MB"
      outputFormat="Compressed PDF"
      features={[
        "Multiple compression levels",
        "Maintains document quality",
        "Reduces file size up to 90%",
        "Fast processing"
      ]}
    />
  );
};
