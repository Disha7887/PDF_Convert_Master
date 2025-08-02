import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const HtmlToPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="html-to-pdf"
      title="HTML to PDF Converter"
      description="Convert HTML files or web pages to PDF documents. Perfect for saving web content and reports."
      acceptedFormats={[".html", ".htm"]}
      maxFileSize="10MB"
      outputFormat="PDF"
      features={[
        "Preserves CSS styling",
        "Includes images and links",
        "Responsive layout support",
        "Custom page sizing"
      ]}
    />
  );
};
