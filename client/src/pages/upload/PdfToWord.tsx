import React from "react";
import { SimpleConversionWorkflow } from "@/components/SimpleConversionWorkflow";
import { FileText } from "lucide-react";

export const PdfToWordUpload: React.FC = () => {
  return (
    <SimpleConversionWorkflow
      toolType="pdf-to-word"
      toolTitle="PDF to Word"
      acceptedFormats={[".pdf"]}
      maxFileSize="50MB"
      toolIcon={<FileText className="w-8 h-8 text-blue-600" />}
    />
  );
};