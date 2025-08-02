import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { FileText } from "lucide-react";

export const PdfToWordUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="pdf-to-word"
        toolTitle="PDF to Word Converter"
        toolDescription="Convert your PDF documents to editable Word documents (.docx) with accurate text and formatting preservation."
        acceptedFormats={[".pdf"]}
        maxFileSize="50MB"
        outputFormat="DOCX"
        toolIcon={<FileText className="w-8 h-8 text-blue-500" />}
        iconBg="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800"
      />
    </div>
  );
};