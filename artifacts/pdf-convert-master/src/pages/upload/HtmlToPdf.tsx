import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Code } from "lucide-react";

export const HtmlToPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="html-to-pdf"
        toolTitle="HTML to PDF Converter"
        toolDescription="Convert HTML files or web pages to PDF documents. Perfect for saving web content, reports, and documentation."
        acceptedFormats={[".html", ".htm"]}
        maxFileSize="10MB"
        outputFormat="PDF"
        toolIcon={<Code className="w-8 h-8 text-blue-500" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};