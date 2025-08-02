import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { Presentation } from "lucide-react";

export const PdfToPowerPointUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ConversionWorkflow
        toolType="pdf-to-powerpoint"
        toolTitle="PDF to PowerPoint Converter"
        toolDescription="Convert your PDF documents to editable PowerPoint presentations (.pptx) with accurate layout preservation."
        acceptedFormats={[".pdf"]}
        maxFileSize="50MB"
        outputFormat="PPTX"
        toolIcon={<Presentation className="w-8 h-8 text-orange-500" />}
        iconBg="bg-orange-50 border-orange-200"
      />
    </div>
  );
};
