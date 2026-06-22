import React from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ToolPageShell } from "@/components/upload/ToolPageShell";
import { toolConfigs, getToolActionLabel } from "@/lib/toolConfig";

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

/**
 * Dashed upload dropzone used as the empty state for each tool. Mirrors the PDF
 * converter upload design: it pulls the tool's own drop-area copy, action label
 * and max file size from its config so every editor tool shares the same look.
 */
export function PdfDropzone({
  onFile,
  loading = false,
  accept = "application/pdf,.pdf",
  title,
  subtitle = "or click to browse files",
  testId = "dropzone-pdf",
  maxSizeMB,
  toolId,
}: PdfDropzoneProps) {
  const exts = accept
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("."));
  const acceptedFormats = exts.length ? exts : [".pdf"];

  const cfg = toolId ? toolConfigs[toolId] : undefined;
  const resolvedTitle = title ?? cfg?.dropAreaText ?? "Drop your PDF here";
  const resolvedActionLabel = cfg ? getToolActionLabel(cfg) : "Select PDF";
  const resolvedMaxFileSize = maxSizeMB ?? cfg?.maxFileSize ?? 200;

  return (
    <UploadDropzone
      acceptedFormats={acceptedFormats}
      maxFileSize={resolvedMaxFileSize}
      toolId={toolId}
      title={resolvedTitle}
      subtitle={subtitle}
      actionLabel={resolvedActionLabel}
      loading={loading}
      loadingText="Opening PDF…"
      onFiles={(files) => onFile(files[0])}
      testId={testId}
    />
  );
}
