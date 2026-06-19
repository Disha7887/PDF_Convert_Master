import React from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ToolPageShell } from "@/components/upload/ToolPageShell";

interface PdfToolLayoutProps {
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBgColor: string;
  iconBorderColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Consistent header + page chrome shared by every PDF Editor tool. */
export function PdfToolLayout({
  icon: Icon,
  iconColor,
  iconBgColor,
  iconBorderColor,
  title,
  description,
  children,
}: PdfToolLayoutProps) {
  return (
    <ToolPageShell
      title={title}
      description={description}
      icon={<Icon className={`w-7 h-7 ${iconColor}`} />}
      iconBoxClassName={`${iconBorderColor} ${iconBgColor}`}
      trustText="Processed entirely in your browser — your file never leaves your device."
    >
      {children}
    </ToolPageShell>
  );
}

interface PdfDropzoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  accept?: string;
  title?: string;
  subtitle?: string;
  testId?: string;
  /** Max file size in MB used for validation copy + checks. */
  maxSizeMB?: number;
  /** Tool id; the upload prompt plays that tool's own Lottie animation. */
  toolId?: string;
}

/** Dashed upload dropzone used as the empty state for each tool. */
export function PdfDropzone({
  onFile,
  loading = false,
  accept = "application/pdf,.pdf",
  title = "Drop your PDF here",
  subtitle = "or click to browse files",
  testId = "dropzone-pdf",
  maxSizeMB = 200,
  toolId,
}: PdfDropzoneProps) {
  const exts = accept
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("."));
  const acceptedFormats = exts.length ? exts : [".pdf"];

  return (
    <UploadDropzone
      acceptedFormats={acceptedFormats}
      maxFileSize={maxSizeMB}
      toolId={toolId}
      title={title}
      subtitle={subtitle}
      actionLabel="Select PDF"
      loading={loading}
      loadingText="Opening PDF…"
      onFiles={(files) => onFile(files[0])}
      testId={testId}
    />
  );
}
