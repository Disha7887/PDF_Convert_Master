import React from "react";
import { PdfEditor } from "@/components/PdfEditor";

export const EditPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PdfEditor />
    </div>
  );
};
