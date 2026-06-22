import React from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { toolConfigs, getToolActionLabel } from "@/lib/toolConfig";

interface ImageDropzoneProps {
  acceptedFormats: string[];
  maxSizeMB: number;
  onFile: (file: File) => void;
  testId?: string;
  /** Tool id; the upload prompt plays that tool's own Lottie animation. */
  toolId?: string;
}

/**
 * Single-image upload dropzone — a thin wrapper over the shared UploadDropzone.
 * Mirrors the PDF converter / editor upload design: it pulls the tool's own
 * drop-area copy and action label from its config so every image tool shares
 * the same look. Falls back to generic image copy when no config is found.
 */
export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  acceptedFormats,
  maxSizeMB,
  onFile,
  testId,
  toolId,
}) => {
  const cfg = toolId ? toolConfigs[toolId] : undefined;
  const resolvedTitle = cfg?.dropAreaText ?? "Drop your image here";
  const resolvedActionLabel = cfg ? getToolActionLabel(cfg) : "Select Image";

  return (
    <UploadDropzone
      acceptedFormats={acceptedFormats}
      maxFileSize={maxSizeMB}
      toolId={toolId}
      title={resolvedTitle}
      actionLabel={resolvedActionLabel}
      onFiles={(files) => onFile(files[0])}
      testId={testId || "dropzone-image"}
    />
  );
};
