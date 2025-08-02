import React from "react";
import { UploadPage } from "@/components/UploadPage";

export const CropImageUpload: React.FC = () => {
  return (
    <UploadPage
      toolId="crop-image"
      title="Image Cropper"
      description="Crop images to remove unwanted areas. Use preset ratios or freeform cropping with live preview."
      acceptedFormats={[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]}
      maxFileSize="20MB"
      outputFormat="Same format"
      features={[
        "Freeform cropping",
        "Preset aspect ratios",
        "Live preview",
        "Precise pixel control"
      ]}
    />
  );
};
