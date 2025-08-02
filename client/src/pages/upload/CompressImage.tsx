import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const CompressImageUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="compress-image"
      title="Image Compressor"
      description="Reduce image file size without losing quality. Perfect for web optimization and storage savings."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
      maxFileSize="25MB"
      outputFormat="Compressed images"
      features={[
        "Lossless compression",
        "Custom quality settings",
        "File size reduction up to 80%",
        "Batch processing"
      ]}
    />
  );
};
