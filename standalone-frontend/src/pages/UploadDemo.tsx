import React from "react";
import { UploadPage, toolConfigs } from "@/components/UploadPage";

export const UploadDemo: React.FC = () => {
  const handleFileUpload = (files: File[]) => {
    console.log('Demo upload:', files);
    alert(`Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-4">Upload Component Demo</h1>
        <p className="text-gray-600">Testing the universal upload component with Word to PDF configuration</p>
      </div>
      
      <UploadPage 
        toolConfig={toolConfigs["word-to-pdf"]} 
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};
