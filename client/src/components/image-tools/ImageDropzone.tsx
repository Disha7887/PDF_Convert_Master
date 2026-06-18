import React, { useCallback, useRef, useState } from "react";
import { ConverterStatusIcon } from "@/components/converter-status-icon";
import { useToast } from "@/hooks/use-toast";

interface ImageDropzoneProps {
  acceptedFormats: string[];
  maxSizeMB: number;
  onFile: (file: File) => void;
  testId?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  acceptedFormats,
  maxSizeMB,
  onFile,
  testId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const validateAndSend = useCallback(
    (file: File) => {
      const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
      if (!acceptedFormats.includes(ext)) {
        toast({
          title: "Unsupported format",
          description: `Please use one of: ${acceptedFormats.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }
      onFile(file);
    },
    [acceptedFormats, maxSizeMB, onFile, toast],
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) validateAndSend(f);
      }}
      className={`cursor-pointer border-2 border-dashed rounded-xl p-10 md:p-14 text-center transition-colors ${
        isDragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
      data-testid={testId || "dropzone-image"}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSend(f);
          e.target.value = "";
        }}
        data-testid="input-file"
      />
      <ConverterStatusIcon status="upload" size={80} className="mb-4" />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
        Drop an image here, or click to browse
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Supports {acceptedFormats.join(", ")} • up to {maxSizeMB}MB
      </p>
    </div>
  );
};
