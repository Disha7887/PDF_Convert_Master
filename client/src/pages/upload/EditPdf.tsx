import React from "react";
import { PdfEditor } from "@/components/PdfEditor";
import { Pencil } from "lucide-react";

export const EditPdfUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-200 dark:bg-blue-900 dark:border-blue-800">
          <Pencil className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit PDF
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add text, images, signatures, drawings, shapes, highlights, stamps
            and notes — then download. Runs entirely in your browser, your file
            is never uploaded.
          </p>
        </div>
      </div>
      <PdfEditor />
    </div>
  );
};
