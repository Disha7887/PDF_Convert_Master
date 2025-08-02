import React from "react";
import { UploadPage, toolConfigs } from "@/components/UploadPage";

export const PdfToWordUpload: React.FC = () => {
  const handleFileUpload = (files: File[]) => {
    // Handle file upload for PDF to Word conversion
    console.log('PDF to Word files uploaded:', files);
    // Add conversion logic here
  };

  return (
    <UploadPage 
      toolConfig={toolConfigs["pdf-to-word"]} 
      onFileUpload={handleFileUpload}
    />
  );
};
