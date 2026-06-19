import React from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

interface EnhancedUploadAreaProps {
  acceptedFormats: string[];
  maxFileSize: string;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  /** Kept for backwards compatibility; drag state is now owned by UploadDropzone. */
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDisabled?: boolean;
  currentFileCount?: number;
  showAdvancedFeatures?: boolean;
  /** Tool id; the upload prompt plays that tool's own Lottie animation. */
  toolId?: string;
}

/**
 * Multi-file upload area for the batch conversion workflow. This is now a thin
 * adapter over the shared `UploadDropzone`: it keeps the same props contract
 * (so `ConversionWorkflow`'s batch logic is untouched) but passes files through
 * WITHOUT filtering — invalid files are surfaced downstream in the file list.
 */
export const EnhancedUploadArea: React.FC<EnhancedUploadAreaProps> = ({
  acceptedFormats,
  maxFileSize,
  maxFiles = 10,
  onFilesSelected,
  isDisabled = false,
  currentFileCount = 0,
  toolId,
}) => {
  return (
    <UploadDropzone
      acceptedFormats={acceptedFormats}
      maxFileSize={maxFileSize}
      multiple
      maxFiles={maxFiles}
      currentFileCount={currentFileCount}
      toolId={toolId}
      disabled={isDisabled}
      validate={false}
      onFiles={onFilesSelected}
      actionLabel={currentFileCount > 0 ? "Add More Files" : "Select Files"}
    />
  );
};
