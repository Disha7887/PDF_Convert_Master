import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedSelectButton } from "@/components/ui/animated-select-button";
import { ConverterStatusIcon } from "@/components/converter-status-icon";
import { UploadIcon, Download, RefreshCw } from "lucide-react";
import {
  ToolConfig,
  getToolActionLabel,
  getServerToolType,
} from "@/lib/toolConfig";

type Stage = "idle" | "converting" | "done" | "error";

const cardShell =
  "flex flex-col w-full md:w-[584px] min-h-[405px] items-center justify-center p-[50px] bg-white rounded-3xl border-2 border-dashed border-blue-300 shadow-sm";

export const HeroToolConverter = ({ tool }: { tool: ToolConfig }): JSX.Element => {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const maxBytes = parseFloat(tool.maxFileSize) * 1024 * 1024;
  const chips = tool.acceptedFormats.map((f) => f.replace(".", "").toUpperCase());
  const label = getToolActionLabel(tool);

  const reset = () => {
    setStage("idle");
    setFileName("");
    setError(null);
    setDownloadUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pollJob = (jobId: number) =>
    new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60;
      const tick = async () => {
        if (!mountedRef.current) return;
        try {
          const r = await fetch(`/api/jobs/${jobId}`);
          const d = await r.json();
          if (!mountedRef.current) return;
          if (!d.success) throw new Error("Failed to get job status");
          const job = d.data;
          if (job.status === "completed") {
            setDownloadUrl(`/api/download/${jobId}`);
            setStage("done");
            resolve();
            return;
          }
          if (job.status === "failed") {
            throw new Error(job.errorMessage || "Conversion failed");
          }
          attempts++;
          if (attempts < maxAttempts) {
            timerRef.current = setTimeout(tick, 1500);
          } else {
            throw new Error("Processing took longer than expected");
          }
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Conversion failed"));
        }
      };
      timerRef.current = setTimeout(tick, 500);
    });

  const convert = async (f: File) => {
    setStage("converting");
    setError(null);
    setFileName(f.name);
    setDownloadUrl(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("toolType", getServerToolType(tool));
      fd.append("fileName", f.name);
      fd.append("fileSize", String(f.size));
      fd.append("options", JSON.stringify({}));
      const res = await fetch("/api/convert", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Conversion failed");
      await pollJob(data.data.jobId);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Conversion failed");
      setStage("error");
    }
  };

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() || "");
    if (!tool.acceptedFormats.includes(ext)) {
      setFileName(f.name);
      setError(`Please select a ${chips.join("/")} file.`);
      setStage("error");
      return;
    }
    if (f.size > maxBytes) {
      setFileName(f.name);
      setError(`File is too large — the limit is ${tool.maxFileSize}.`);
      setStage("error");
      return;
    }
    convert(f);
  };

  return (
    <Card
      className={cardShell}
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
        handleFiles(e.dataTransfer.files);
      }}
      data-testid={`hero-converter-${tool.id}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={tool.acceptedFormats.join(",")}
        className="hidden"
        data-testid={`input-hero-${tool.id}`}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {stage === "idle" && (
        <div
          className={`flex flex-col items-center justify-center w-full transition-colors ${
            isDragOver ? "opacity-80" : ""
          }`}
        >
          <ConverterStatusIcon
            status="upload"
            size={112}
            className="mb-2"
            toolIcon={tool.icon}
            toolIconColor={tool.iconColor}
            toolIconBgColor={tool.iconBgColor}
            toolIconBorderColor={tool.iconBorderColor}
          />

          <h2
            className="font-bold text-gray-900 text-xl text-center mb-3"
            data-testid={`text-hero-heading-${tool.id}`}
          >
            {tool.dropAreaText}
          </h2>

          <p className="font-normal text-gray-600 text-base text-center mb-8">
            or click to browse files
          </p>

          <AnimatedSelectButton
            onClick={() => inputRef.current?.click()}
            className="h-[57px] px-12 py-4 mb-8 rounded-full shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]"
            data-testid={`button-hero-action-${tool.id}`}
          >
            <UploadIcon className="mr-2 h-5 w-5" />
            <span className="text-base">{label}</span>
          </AnimatedSelectButton>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
                data-testid={`chip-hero-${tool.id}-${c}`}
              >
                {c}
              </span>
            ))}
            <span className="inline-flex items-center text-xs text-gray-400">
              Max {tool.maxFileSize}
            </span>
          </div>
        </div>
      )}

      {stage === "converting" && (
        <div className="flex flex-col items-center justify-center w-full text-center">
          <ConverterStatusIcon status="processing" size={96} className="mb-3" />
          <h2 className="font-bold text-gray-900 text-xl mb-2">Converting…</h2>
          <p
            className="text-gray-600 text-sm truncate max-w-full"
            data-testid={`text-hero-converting-${tool.id}`}
          >
            {fileName}
          </p>
        </div>
      )}

      {stage === "done" && (
        <div className="flex flex-col items-center justify-center w-full text-center">
          <ConverterStatusIcon status="success" size={96} className="mb-2" />
          <h2 className="font-bold text-gray-900 text-xl mb-2">
            Conversion complete
          </h2>
          <p className="text-gray-600 text-sm mb-6 truncate max-w-full">
            {fileName}
          </p>
          <a
            href={downloadUrl ?? "#"}
            className="inline-flex items-center justify-center h-[57px] px-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold mb-4 shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] transition-colors"
            data-testid={`button-hero-download-${tool.id}`}
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </a>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            data-testid={`button-hero-reset-${tool.id}`}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Convert another file
          </button>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center justify-center w-full text-center">
          <ConverterStatusIcon status="error" size={96} className="mb-2" />
          <h2 className="font-bold text-gray-900 text-xl mb-2">
            Something went wrong
          </h2>
          <p
            className="text-red-600 text-sm mb-6 max-w-full"
            data-testid={`text-hero-error-${tool.id}`}
          >
            {error}
          </p>
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
            data-testid={`button-hero-retry-${tool.id}`}
          >
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
};
