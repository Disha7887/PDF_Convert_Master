import React from "react";
import { UploadPage, toolConfigs } from "@/components/UploadPage";

export const MergePdfsUpload: React.FC = () => {
  const handleFileUpload = (files: File[]) => {
    // Handle file upload for PDF merging
    console.log('Merge PDFs files uploaded:', files);
    // Add merging logic here
  };

  return (
    <UploadPage 
      toolConfig={toolConfigs["merge-pdfs"]} 
      onFileUpload={handleFileUpload}
    />
  );
};
