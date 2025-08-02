import React from "react";
import { UploadPage, toolConfigs } from "@/components/UploadPage";

export const PdfToExcelUpload: React.FC = () => {
  const handleFileUpload = (files: File[]) => {
    // Handle file upload for PDF to Excel conversion
    console.log('PDF to Excel files uploaded:', files);
    // Add conversion logic here
  };

  return (
    <UploadPage 
      toolConfig={toolConfigs["pdf-to-excel"]} 
      onFileUpload={handleFileUpload}
    />
  );
};
