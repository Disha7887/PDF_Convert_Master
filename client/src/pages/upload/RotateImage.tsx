import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const RotateImageUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="rotate-image"
      title="Image Rotator"
      description="Rotate images by any angle. Quick 90° rotations or custom angle rotation with automatic background fill."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
      maxFileSize="20MB"
      outputFormat="Same format"
      features={[
        "90°, 180°, 270° quick rotations",
        "Custom angle rotation", 
        "Auto background fill",
        "Maintain image quality"
      ]}
    />
  );
};
