import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Presentation } from "lucide-react";

export const PowerPointToPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="powerpoint-to-pdf"
        toolTitle="PowerPoint to PDF Converter"
        toolDescription="Convert your PowerPoint presentations (.ppt, .pptx) to PDF format with perfect slide layouts and formatting."
        acceptedFormats={[".ppt", ".pptx"]}
        maxFileSize="100MB"
        outputFormat="PDF"
        toolIcon={<Presentation className="w-8 h-8 text-orange-500" />}
        iconBg="bg-orange-50 border-orange-200 dark:bg-orange-900 dark:border-orange-800"
      />
    </div>
  );
};