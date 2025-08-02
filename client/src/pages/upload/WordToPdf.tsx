import React from "react";
import { UploadPage, toolConfigs } from "@/components/UploadPage";

export const WordToPdfUpload: React.FC = () => {
  const handleFileUpload = (files: File[]) => {
    // Handle file upload for Word to PDF conversion
    console.log('Word to PDF files uploaded:', files);
    // Add conversion logic here
  };

  return (
    <UploadPage 
      toolConfig={toolConfigs["word-to-pdf"]} 
      onFileUpload={handleFileUpload}
    />
  );
};
