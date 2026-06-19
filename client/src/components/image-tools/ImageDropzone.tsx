import React from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

interface ImageDropzoneProps {
  acceptedFormats: string[];
  maxSizeMB: number;
  onFile: (file: File) => void;
  testId?: string;
  /** Tool id; the upload prompt plays that tool's own Lottie animation. */
  toolId?: string;
}

/** Single-image upload dropzone — a thin wrapper over the shared UploadDropzone. */
export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  acceptedFormats,
  maxSizeMB,
  onFile,
  testId,
  toolId,
}) => {
  return (
    <UploadDropzone
      acceptedFormats={acceptedFormats}
      maxFileSize={maxSizeMB}
      toolId={toolId}
      title="Drop your image here"
      actionLabel="Select Image"
      onFiles={(files) => onFile(files[0])}
      testId={testId || "dropzone-image"}
    />
  );
};
