import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const ExcelToPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="excel-to-pdf"
      title="Excel to PDF Converter"
      description="Convert your Excel spreadsheets (.xls, .xlsx) to PDF format while preserving formatting and layout."
      acceptedFormats={[".xls", ".xlsx"]}
      maxFileSize="50MB"
      outputFormat="PDF"
      features={[
        "Preserves original formatting",
        "Maintains charts and tables", 
        "High-quality conversion",
        "Secure processing"
      ]}
    />
  );
};
