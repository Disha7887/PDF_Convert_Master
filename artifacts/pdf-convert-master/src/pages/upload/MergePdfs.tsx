import React from "react";
import { PdfMergeWorkflow } from "@/components/PdfMergeWorkflow";
import { FileStack } from "lucide-react";

export const MergePdfsUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PdfMergeWorkflow
        toolTitle="PDF Merger"
        toolDescription="Combine multiple PDF files into a single document. Add your files, drag the order with the arrows (top = first), then merge into one PDF."
        acceptedFormats={[".pdf"]}
        maxFileSize="100MB"
        toolIcon={<FileStack className="w-8 h-8 text-blue-600" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};
