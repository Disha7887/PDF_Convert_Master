import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { FileSpreadsheet } from "lucide-react";

export const PdfToExcelUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="pdf-to-excel"
        toolTitle="PDF to Excel Converter"
        toolDescription="Convert your PDF documents to editable Excel spreadsheets (.xlsx) with accurate data table extraction."
        acceptedFormats={[".pdf"]}
        maxFileSize="50MB"
        outputFormat="XLSX"
        toolIcon={<FileSpreadsheet className="w-8 h-8 text-green-500" />}
        iconBg="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800"
      />
    </div>
  );
};