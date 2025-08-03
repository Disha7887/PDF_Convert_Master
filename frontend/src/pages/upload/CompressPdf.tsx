import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Minimize2 } from "lucide-react";

export const CompressPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="compress-pdf"
        toolTitle="PDF Compressor"
        toolDescription="Reduce PDF file size while maintaining document quality. Choose from different compression levels to optimize for your needs."
        acceptedFormats={[".pdf"]}
        maxFileSize="200MB"
        outputFormat="Compressed PDF"
        toolIcon={<Minimize2 className="w-8 h-8 text-green-600" />}
        iconBg="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800"
      />
    </div>
  );
};