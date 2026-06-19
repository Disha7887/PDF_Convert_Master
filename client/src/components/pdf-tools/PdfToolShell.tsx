import React, { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ConverterStatusIcon } from "@/components/converter-status-icon";

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-4 mb-8">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border ${iconBorderColor} ${iconBgColor} shadow-sm shrink-0`}
          >
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900"
              data-testid="heading-tool-title"
            >
              {title}
            </h1>
            <p className="text-gray-500 mt-1">{description}</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Processed entirely in your browser — your file never leaves your device.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

interface PdfDropzoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  accept?: string;
  title?: string;
  subtitle?: string;
  testId?: string;
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
  toolId,
}: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl border-2 border-dashed px-6 py-16 transition-colors ${
        drag
          ? "border-blue-500 bg-blue-50"
          : "border-blue-200 bg-white hover:bg-blue-50/50"
      }`}
      data-testid={testId}
    >
      {loading ? (
        <ConverterStatusIcon status="processing" size={88} className="mb-3" />
      ) : (
        <ConverterStatusIcon
          status="upload"
          size={88}
          className="mb-3"
          toolId={toolId}
        />
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        {loading ? "Opening PDF…" : title}
      </h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
        data-testid="input-pdf"
      />
    </div>
  );
}
