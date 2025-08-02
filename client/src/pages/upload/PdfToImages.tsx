import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Image } from "lucide-react";

export const PdfToImagesUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="pdf-to-images"
        toolTitle="PDF to Images Converter"
        toolDescription="Convert PDF pages to high-quality image files (JPG, PNG). Each page becomes a separate image with customizable resolution."
        acceptedFormats={[".pdf"]}
        maxFileSize="50MB"
        outputFormat="JPG/PNG"
        toolIcon={<Image className="w-8 h-8 text-red-500" />}
        iconBg="bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800"
      />
    </div>
  );
};