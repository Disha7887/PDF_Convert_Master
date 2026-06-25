import { useEffect, useRef, useState } from "react";
import { authedFetch, getAuthError, AuthError } from "@/lib/authedFetch";
import { downloadFromUrl } from "@/lib/download";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthErrorAction } from "@/components/AuthErrorAction";
import { ConverterStatusIcon } from "@/components/converter-status-icon";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, RefreshCw } from "lucide-react";
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
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("");
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "Images to PDF" combines MULTIPLE images into ONE PDF, so the hero card
  // accepts several files and posts them to the dedicated multi-file endpoint
  // (every other hero tool is single-file via /api/convert).
  const isImagesToPdf = tool.id === "images-to-pdf";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const label = getToolActionLabel(tool);

  const reset = () => {
    setStage("idle");
    setFileName("");
    setOutputName("");
    setError(null);
    setAuthError(null);
    setDownloadUrl(null);
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
    setAuthError(null);
    setFileName(f.name);
    setDownloadUrl(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("toolType", getServerToolType(tool));
      fd.append("fileName", f.name);
      fd.append("fileSize", String(f.size));
      fd.append("options", JSON.stringify({}));
      const res = await authedFetch("/api/convert", { method: "POST", body: fd });
      const data = await res.json();
      const authErr = getAuthError(res.status, data?.error);
      if (authErr) throw authErr;
      if (!data.success) throw new Error(data.error || "Conversion failed");
      await pollJob(data.data.jobId);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e instanceof AuthError) setAuthError(e);
      setError(e instanceof Error ? e.message : "Conversion failed");
      setStage("error");
    }
  };

  const convertImages = async (fs: File[]) => {
    if (fs.length === 0) return;
    setStage("converting");
    setError(null);
    setAuthError(null);
    setFileName(fs.length === 1 ? fs[0].name : `${fs.length} images`);
    setOutputName("images.pdf");
    setDownloadUrl(null);
    try {
      const fd = new FormData();
      for (const f of fs) fd.append("files", f);
      const res = await authedFetch("/api/images-to-pdf", { method: "POST", body: fd });
      const data = await res.json();
      const authErr = getAuthError(res.status, data?.error);
      if (authErr) throw authErr;
      if (!data.success) throw new Error(data.error || "Conversion failed");
      await pollJob(data.data.jobId);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e instanceof AuthError) setAuthError(e);
      setError(e instanceof Error ? e.message : "Conversion failed");
      setStage("error");
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      await downloadFromUrl(downloadUrl, outputName || fileName || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
      setStage("error");
    }
  };

  if (stage === "idle") {
    return (
      <UploadDropzone
        acceptedFormats={tool.acceptedFormats}
        maxFileSize={tool.maxFileSize}
        toolId={tool.id}
        title={tool.dropAreaText}
        actionLabel={label}
        multiple={isImagesToPdf}
        maxFiles={isImagesToPdf ? 20 : undefined}
        onFiles={(files) => (isImagesToPdf ? convertImages(files) : convert(files[0]))}
        onValidationError={(msg) => {
          setFileName("");
          setError(msg);
          setStage("error");
        }}
        className="w-full md:w-[584px] min-h-[405px] justify-center rounded-3xl border-blue-300 p-[50px] shadow-sm"
        testId={`hero-converter-${tool.id}`}
      />
    );
  }

  return (
    <Card className={cardShell} data-testid={`hero-converter-${tool.id}`}>
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
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center h-[57px] px-12 rounded-full bg-[#f7433d] hover:bg-[#e23a34] text-white font-semibold mb-4 shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] transition-colors"
            data-testid={`button-hero-download-${tool.id}`}
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </button>
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
            className="text-red-600 text-sm mb-4 max-w-full"
            data-testid={`text-hero-error-${tool.id}`}
          >
            {error}
          </p>
          {authError && (
            <div className="mb-6">
              <AuthErrorAction
                to={authError.linkTo}
                label={authError.linkLabel}
                testId={`link-hero-auth-${tool.id}`}
              />
            </div>
          )}
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
