import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { FileText } from "lucide-react";

export const WordToPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="word-to-pdf"
        toolTitle="Word to PDF Converter"
        toolDescription="Convert your Word documents (.doc, .docx) to PDF format while preserving formatting, fonts, and layout."
        acceptedFormats={[".doc", ".docx"]}
        maxFileSize="50MB"
        outputFormat="PDF"
        toolIcon={<FileText className="w-8 h-8 text-blue-500" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};