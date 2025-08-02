import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { FileStack } from "lucide-react";

export const MergePdfsUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="merge-pdfs"
        toolTitle="PDF Merger"
        toolDescription="Combine multiple PDF files into a single document. Drag and drop to reorder pages and customize the final merged PDF."
        acceptedFormats={[".pdf"]}
        maxFileSize="100MB"
        outputFormat="Merged PDF"
        toolIcon={<FileStack className="w-8 h-8 text-blue-600" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};