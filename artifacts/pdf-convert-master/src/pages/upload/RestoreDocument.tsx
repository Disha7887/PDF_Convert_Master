import React from "react";
import { ConversionWorkflow } from "@/components/ConversionWorkflow";
import { RefreshCw } from "lucide-react";

export const RestoreDocumentUpload: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ConversionWorkflow
        toolType="restore-document"
        toolTitle="Document Restore"
        toolDescription="Upload a broken or damaged PDF, scan, or photo and get back a clean, sharpened PDF. We deskew, de-fade, denoise and sharpen the page(s) — without ever fabricating missing content."
        acceptedFormats={[".pdf", ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"]}
        maxFileSize="25MB"
        outputFormat="Restored PDF"
        toolIcon={<RefreshCw className="w-8 h-8 text-[#f7433d]" />}
        iconBg="bg-[#f7433d]/10 border-[#f7433d]/20"
      />
    </div>
  );
};
