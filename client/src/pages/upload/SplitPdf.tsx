import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const SplitPdfUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="split-pdf"
      title="PDF Splitter"
      description="Split large PDF files into smaller documents by page ranges, extract specific pages, or split by page count."
      acceptedFormats={[".pdf"]}
      maxFileSize="100MB"
      outputFormat="PDF files"
      features={[
        "Split by page ranges",
        "Extract specific pages",
        "Split into equal parts",
        "Preview before splitting"
      ]}
    />
  );
};
