import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const PdfToPowerPointUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="pdf-to-powerpoint"
      title="PDF to PowerPoint Converter"
      description="Convert your PDF documents to editable PowerPoint presentations (.pptx) with accurate layout preservation."
      acceptedFormats={[".pdf"]}
      maxFileSize="50MB"
      outputFormat="PPTX"
      features={[
        "Editable text and images",
        "Preserves layout structure",
        "Creates separate slides",
        "Professional quality output"
      ]}
    />
  );
};
