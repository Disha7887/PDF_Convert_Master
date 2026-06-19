import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Scissors } from "lucide-react";

export const SplitPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="split-pdf"
        toolTitle="PDF Splitter"
        toolDescription="Split large PDF files into smaller documents by page ranges, extract specific pages, or divide into equal parts with preview."
        acceptedFormats={[".pdf"]}
        maxFileSize="100MB"
        outputFormat="PDF Files"
        toolIcon={<Scissors className="w-8 h-8 text-blue-600" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};