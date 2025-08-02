import React from "react";
import { SimpleConversionWorkflow } from "@/components/SimpleConversionWorkflow";
import { FileSpreadsheet } from "lucide-react";

export const PdfToExcelUpload: React.FC = () => {
  return (
    <SimpleConversionWorkflow
      toolType="pdf-to-excel"
      toolTitle="PDF to Excel"
      acceptedFormats={[".pdf"]}
      maxFileSize="50MB"
      toolIcon={<FileSpreadsheet className="w-8 h-8 text-green-600" />}
    />
  );
};