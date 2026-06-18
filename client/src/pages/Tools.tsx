import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toolConfigs, type ToolConfig } from "@/lib/toolConfig";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResizeModal,
  CropModal,
  RotateModal,
  type WorkingImage,
} from "./ImageEditTools";
import { loadImageFromUrl, downloadBlob, withSuffix, exportExtension } from "@/lib/imageTools";

// Map frontend tool config ids to the exact backend ToolType strings.
// NOTE: several image tools are singular on the backend (resize_image, not
// resize_images), so a naive dash->underscore replace would break them.
const toolTypeMap: Record<string, string> = {
  "pdf-to-word": "pdf_to_word",
  "pdf-to-excel": "pdf_to_excel",
  "pdf-to-powerpoint": "pdf_to_powerpoint",
  "pdf-to-images": "pdf_to_images",
  "word-to-pdf": "word_to_pdf",
  "excel-to-pdf": "excel_to_pdf",
  "powerpoint-to-pdf": "powerpoint_to_pdf",
  "html-to-pdf": "html_to_pdf",
  "images-to-pdf": "images_to_pdf",
  "resize-images": "resize_image",
  "crop-images": "crop_image",
  "rotate-images": "rotate_image",
  "convert-image-format": "convert_image_format",
  "compress-images": "compress_image",
  "upscale-images": "upscale_image",
  "remove-background": "remove_background",
  "merge-pdfs": "merge_pdfs",
  "split-pdf": "split_pdf",
  "compress-pdf": "compress_pdf",
  "rotate-pdf": "rotate_pdf",
};

// These three tools are handled entirely in the browser with a manual-options
// popup (set width/height, crop region, or rotation) instead of a server-side
// /api/convert call with no options.
type EditOp = "resize" | "crop" | "rotate";
const manualEditMap: Record<string, EditOp> = {
  "resize-images": "resize",
  "crop-images": "crop",
  "rotate-images": "rotate",
};
const editSuffixMap: Record<EditOp, string> = {
  resize: "resized",
  crop: "cropped",
  rotate: "rotated",
};

type CardStage = "idle" | "ready" | "converting" | "done" | "error";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Correct, human-readable action label per tool for the convert button.
// Avoids generic/incorrect text like "Convert to Same Format".
const getActionLabel = (cfg: ToolConfig): string => {
  const labels: Record<string, string> = {
    "pdf-to-word": "Convert to Word",
    "pdf-to-excel": "Convert to Excel",
    "pdf-to-powerpoint": "Convert to PowerPoint",
    "pdf-to-images": "Convert to Images",
    "word-to-pdf": "Convert to PDF",
    "excel-to-pdf": "Convert to PDF",
    "powerpoint-to-pdf": "Convert to PDF",
    "html-to-pdf": "Convert to PDF",
    "images-to-pdf": "Convert to PDF",
    "resize-images": "Resize Images",
    "crop-images": "Crop Images",
    "rotate-images": "Rotate Images",
    "convert-image-format": "Convert Image",
    "compress-images": "Compress Images",
    "upscale-images": "Upscale Images",
    "remove-background": "Remove Background",
    "merge-pdfs": "Merge PDFs",
    "split-pdf": "Split PDF",
    "compress-pdf": "Compress PDF",
    "rotate-pdf": "Rotate PDF",
  };
  return labels[cfg.id] ?? cfg.title;
};

interface ToolCardProps {
  toolConfig: ToolConfig;
}

const ToolCard: React.FC<ToolCardProps> = ({ toolConfig }) => {
  const IconComponent = toolConfig.icon;
  const [stage, setStage] = useState<CardStage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [targetFormat, setTargetFormat] = useState<string>("png");
  const [compressionQuality, setCompressionQuality] = useState<number>(80);
  const [editImage, setEditImage] = useState<WorkingImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const editUrlRef = useRef<string | null>(null);
  // Bumped on every new edit action (open/apply) and on reset; an async decode
  // whose token no longer matches is stale and must not touch state.
  const loadSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (editUrlRef.current) URL.revokeObjectURL(editUrlRef.current);
    };
  }, []);

  const editOp = manualEditMap[toolConfig.id];
  const isManualEdit = Boolean(editOp);
  const needsFormatPicker = toolConfig.id === "convert-image-format";
  const needsCompressionPicker = toolConfig.id === "compress-images";

  // Track the single live object URL for the working image so it can be revoked
  // when replaced or on unmount, avoiding leaks across re-edits.
  const setWorking = (wi: WorkingImage | null) => {
    if (editUrlRef.current && (!wi || wi.url !== editUrlRef.current)) {
      URL.revokeObjectURL(editUrlRef.current);
    }
    editUrlRef.current = wi ? wi.url : null;
    setEditImage(wi);
  };

  // Load the picked file into a working image and open its manual-options popup.
  const openEditor = async (picked: File) => {
    const url = URL.createObjectURL(picked);
    const seq = ++loadSeqRef.current;
    try {
      const img = await loadImageFromUrl(url);
      if (!mountedRef.current || seq !== loadSeqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setWorking({
        blob: picked,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: picked.name,
      });
      setFile(picked);
      setError(null);
      setStage("ready");
      setModalOpen(true);
    } catch {
      URL.revokeObjectURL(url);
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setError("Could not load this image. It may be corrupted or unsupported.");
      setStage("error");
    }
  };

  // Modal "Apply" callback: the edited blob becomes the new working image so the
  // result can be downloaded (and re-edited), then show the done state.
  const handleEditApply = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const seq = ++loadSeqRef.current;
    try {
      const img = await loadImageFromUrl(url);
      if (!mountedRef.current || seq !== loadSeqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      const baseName = file?.name ?? editImage?.name ?? "image.png";
      setWorking({
        blob,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: baseName,
      });
      setModalOpen(false);
      setStage("done");
    } catch {
      URL.revokeObjectURL(url);
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setModalOpen(false);
      setError("Could not process the edited image.");
      setStage("error");
    }
  };

  const handleEditDownload = () => {
    if (!editImage || !editOp) return;
    // Canvas re-encodes non-jpeg/png/webp inputs (e.g. gif/bmp) as PNG, so the
    // download extension must match the actual exported bytes.
    downloadBlob(
      editImage.blob,
      withSuffix(editImage.name, editSuffixMap[editOp], exportExtension(editImage.name)),
    );
  };

  const acceptAttr = toolConfig.acceptedFormats.join(",");
  const formatList = toolConfig.acceptedFormats
    .map((f) => f.replace(".", "").toUpperCase())
    .join(", ");
  const maxSizeBytes = (parseFloat(toolConfig.maxFileSize) || 50) * 1024 * 1024;

  const selectFile = (incoming: FileList | File[]) => {
    const picked = Array.from(incoming)[0];
    if (!picked) return;

    const ext = "." + (picked.name.split(".").pop()?.toLowerCase() || "");
    if (!toolConfig.acceptedFormats.includes(ext)) {
      setError(`Unsupported file type. Accepts: ${formatList}`);
      setStage("error");
      return;
    }
    if (picked.size > maxSizeBytes) {
      setError(`File is too large. Max ${toolConfig.maxFileSize}.`);
      setStage("error");
      return;
    }
    // Manual image tools open a popup to set options instead of converting.
    if (isManualEdit) {
      void openEditor(picked);
      return;
    }
    setFile(picked);
    setError(null);
    setStage("ready");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectFile(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files);
    }
  };

  const pollJob = (jobId: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 90;
      const tick = async () => {
        try {
          if (!mountedRef.current) {
            resolve();
            return;
          }
          const res = await fetch(`/api/jobs/${jobId}`);
          const data = await res.json();
          if (!mountedRef.current) {
            resolve();
            return;
          }
          if (!data.success) throw new Error("Failed to check status");
          const job = data.data;

          if (job.status === "completed") {
            setDownloadUrl(`/api/download/${jobId}`);
            setOutputName(job.outputFilename || "converted-file");
            setProgress(100);
            setStage("done");
            resolve();
            return;
          }
          if (job.status === "failed") {
            throw new Error(job.errorMessage || "Conversion failed");
          }
          setProgress((p) => Math.min(95, p + 7));
          attempts += 1;
          if (attempts < maxAttempts) {
            setTimeout(tick, 1200);
          } else {
            throw new Error("Processing took longer than expected");
          }
        } catch (err) {
          reject(err);
        }
      };
      setTimeout(tick, 600);
    });

  const startConversion = async () => {
    if (!file) return;
    setStage("converting");
    setProgress(8);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("toolType", toolTypeMap[toolConfig.id]);
      formData.append("fileName", file.name);
      formData.append("fileSize", file.size.toString());
      const options: Record<string, unknown> = {};
      if (needsFormatPicker) options.outputFormat = targetFormat;
      if (needsCompressionPicker) options.quality = compressionQuality;
      formData.append("options", JSON.stringify(options));

      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Could not start conversion");
      }
      await pollJob(data.data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setStage("error");
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const reset = () => {
    loadSeqRef.current += 1; // invalidate any in-flight edit decode
    setStage("idle");
    setFile(null);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setOutputName("");
    setIsDragOver(false);
    setModalOpen(false);
    setWorking(null);
  };

  const cardBase =
    "w-full max-w-[290px] p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg transition-all duration-200";
  const cardIdle = "h-[380px] hover:shadow-xl hover:scale-[1.02]";
  const cardActive = "min-h-[380px] shadow-xl";

  // Compact header used in all non-idle stages
  const CompactHeader = (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-11 h-11 flex items-center justify-center rounded-xl border ${toolConfig.iconBorderColor} ${toolConfig.iconBgColor} shadow-sm shrink-0`}
      >
        <IconComponent className={`w-6 h-6 ${toolConfig.iconColor}`} />
      </div>
      <h3 className="text-base font-bold text-gray-900 leading-tight">
        {toolConfig.title}
      </h3>
      {stage !== "converting" && (
        <button
          onClick={reset}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
          data-testid={`button-close-${toolConfig.id}`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  if (stage === "idle") {
    return (
      <div className={`${cardBase} ${cardIdle}`} data-testid={`card-tool-${toolConfig.id}`}>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleInputChange}
          className="hidden"
          data-testid={`input-file-${toolConfig.id}`}
        />
        <div
          className={`flex flex-col h-full ${isDragOver ? "opacity-80" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
        >
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 p-1 flex items-center justify-center rounded-2xl border ${toolConfig.iconBorderColor} ${toolConfig.iconBgColor} shadow-md`}
            >
              <IconComponent className={`w-9 h-9 ${toolConfig.iconColor}`} />
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-3">
            {toolConfig.title}
          </h3>

          <p className="text-sm text-gray-600 text-center mb-4 flex-grow flex items-center justify-center px-2">
            {toolConfig.description}
          </p>

          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
              <span className="font-medium">Accepts:</span> {formatList}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Max: {toolConfig.maxFileSize}
            </div>
          </div>

          <Button
            onClick={() => inputRef.current?.click()}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl"
            data-testid={`button-select-${toolConfig.id}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {toolConfig.buttonText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardBase} ${cardActive}`} data-testid={`card-tool-${toolConfig.id}`}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleInputChange}
        className="hidden"
        data-testid={`input-file-${toolConfig.id}`}
      />
      {CompactHeader}

      {/* Manual-edit option popups (resize / crop / rotate) */}
      {isManualEdit && modalOpen && editImage && editOp === "resize" && (
        <ResizeModal
          image={editImage}
          onApply={handleEditApply}
          onCancel={() => setModalOpen(false)}
        />
      )}
      {isManualEdit && modalOpen && editImage && editOp === "crop" && (
        <CropModal
          image={editImage}
          onApply={handleEditApply}
          onCancel={() => setModalOpen(false)}
        />
      )}
      {isManualEdit && modalOpen && editImage && editOp === "rotate" && (
        <RotateModal
          image={editImage}
          onApply={handleEditApply}
          onCancel={() => setModalOpen(false)}
        />
      )}

      {/* READY (server-conversion tools) */}
      {stage === "ready" && file && !isManualEdit && (
        <div
          className="flex flex-col"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
        >
          <div
            className={`flex items-center gap-3 p-3 mb-4 rounded-xl border ${
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium text-gray-900 truncate"
                data-testid={`text-filename-${toolConfig.id}`}
              >
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
            </div>
          </div>

          {needsFormatPicker && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Convert to
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid={`select-format-${toolConfig.id}`}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
                <option value="gif">GIF</option>
                <option value="avif">AVIF</option>
                <option value="tiff">TIFF</option>
              </select>
            </div>
          )}

          {needsCompressionPicker && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor={`slider-compression-${toolConfig.id}`}
                  className="text-xs font-medium text-gray-600"
                >
                  Compression level
                </label>
                <span
                  className="text-xs font-semibold text-blue-600"
                  data-testid={`text-compression-quality-${toolConfig.id}`}
                >
                  Quality {compressionQuality}%
                </span>
              </div>
              <input
                id={`slider-compression-${toolConfig.id}`}
                type="range"
                min={10}
                max={100}
                step={5}
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
                data-testid={`slider-compression-${toolConfig.id}`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
          )}

          <Button
            onClick={startConversion}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl mb-2"
            data-testid={`button-convert-${toolConfig.id}`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {needsFormatPicker
              ? `Convert to ${targetFormat.toUpperCase()}`
              : getActionLabel(toolConfig)}
          </Button>

          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            data-testid={`button-change-${toolConfig.id}`}
          >
            Choose a different file
          </button>
        </div>
      )}

      {/* READY (manual image-edit tools) */}
      {stage === "ready" && file && isManualEdit && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 p-3 mb-4 rounded-xl border border-gray-200 bg-white">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium text-gray-900 truncate"
                data-testid={`text-filename-${toolConfig.id}`}
              >
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {editImage
                  ? `${editImage.width} × ${editImage.height}px`
                  : formatBytes(file.size)}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl mb-2"
            data-testid={`button-edit-${toolConfig.id}`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {getActionLabel(toolConfig)}
          </Button>

          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            data-testid={`button-change-${toolConfig.id}`}
          >
            Choose a different file
          </button>
        </div>
      )}

      {/* CONVERTING */}
      {stage === "converting" && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Converting your file…
          </p>
          {file && (
            <p className="text-xs text-gray-500 truncate max-w-full px-4 mb-4">
              {file.name}
            </p>
          )}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
              data-testid={`progress-${toolConfig.id}`}
            />
          </div>
          <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
        </div>
      )}

      {/* DONE (server-conversion tools) */}
      {stage === "done" && !isManualEdit && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-50 mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">Ready!</p>
          <p
            className="text-xs text-gray-500 text-center truncate max-w-full px-2 mb-5"
            data-testid={`text-output-${toolConfig.id}`}
          >
            {outputName}
          </p>

          <Button
            onClick={handleDownload}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl mb-2"
            data-testid={`button-download-${toolConfig.id}`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <button
            onClick={reset}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            data-testid={`button-again-${toolConfig.id}`}
          >
            Convert another file
          </button>
        </div>
      )}

      {/* DONE (manual image-edit tools) */}
      {stage === "done" && isManualEdit && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-50 mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">Ready!</p>
          <p
            className="text-xs text-gray-500 text-center truncate max-w-full px-2 mb-5"
            data-testid={`text-output-${toolConfig.id}`}
          >
            {editImage ? `${editImage.width} × ${editImage.height}px` : ""}
          </p>

          <Button
            onClick={handleEditDownload}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl mb-2"
            data-testid={`button-download-${toolConfig.id}`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <button
            onClick={() => setModalOpen(true)}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            data-testid={`button-editagain-${toolConfig.id}`}
          >
            Edit again
          </button>

          <button
            onClick={reset}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            data-testid={`button-again-${toolConfig.id}`}
          >
            Use another file
          </button>
        </div>
      )}

      {/* ERROR */}
      {stage === "error" && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-50 mb-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            Something went wrong
          </p>
          <p
            className="text-xs text-gray-500 text-center px-2 mb-5"
            data-testid={`text-error-${toolConfig.id}`}
          >
            {error}
          </p>

          <Button
            onClick={() => inputRef.current?.click()}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl"
            data-testid={`button-retry-${toolConfig.id}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Try another file
          </Button>
        </div>
      )}
    </div>
  );
};

export const Tools: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All Tools");

  const mainToolKeys = [
    "pdf-to-word",
    "pdf-to-excel",
    "pdf-to-powerpoint",
    "pdf-to-images",
    "word-to-pdf",
    "excel-to-pdf",
    "powerpoint-to-pdf",
    "html-to-pdf",
    "images-to-pdf",
    "resize-images",
    "crop-images",
    "rotate-images",
    "convert-image-format",
    "compress-images",
    "upscale-images",
    "remove-background",
    "merge-pdfs",
    "split-pdf",
    "compress-pdf",
    "rotate-pdf",
  ];

  const toolsData = mainToolKeys.map((key) => toolConfigs[key]).filter(Boolean);

  const filterButtons = [
    "All Tools",
    "Convert",
    "Edit",
    "Organize",
    "Security",
    "Image Tools",
  ];

  const filteredTools =
    activeFilter === "All Tools"
      ? toolsData
      : toolsData.filter((tool) => tool.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Buttons */}
      <div className="w-full py-8 px-4 sm:px-8 lg:px-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap pb-8">
            {filterButtons.map((buttonName, index) => (
              <Button
                key={index}
                variant={activeFilter === buttonName ? "default" : "outline"}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full font-medium text-sm sm:text-base ${
                  activeFilter === buttonName
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setActiveFilter(buttonName)}
                data-testid={`filter-${buttonName.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {buttonName}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="w-full px-4 sm:px-8 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 place-items-start justify-items-center">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} toolConfig={tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
