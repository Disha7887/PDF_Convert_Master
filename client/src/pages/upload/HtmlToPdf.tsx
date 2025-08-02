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
        toolIcon={<Code className="w-8 h-8 text-purple-500" />}
        iconBg="bg-purple-50 border-purple-200 dark:bg-purple-900 dark:border-purple-800"
      />
    </div>
  );
};