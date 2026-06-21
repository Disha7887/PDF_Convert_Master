import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Asset } from "expo-asset";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ConverterStatusIcon from "@/components/ConverterStatusIcon";
import DownloadFormatModal from "@/components/DownloadFormatModal";
import FileBrokenIcon from "@/components/FileBrokenIcon";
import { Button, Card, ScreenScroll } from "@/components/ui";
import { API_ORIGIN } from "@/constants/api";
import colors from "@/constants/colors";
import { addFile } from "@/constants/files";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { getToolActionLabel, getToolById, type Tool } from "@/constants/tools";
import { SAMPLE_ASSETS } from "@/mocks/data";
import {
  getConversionResult,
  startConversion,
  type ConversionOptions,
  type ConversionResult,
  type PickedFile,
} from "@/services/api";

const C = colors.light;
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];

/** Show a friendly "taking longer" hint once a job runs past this many seconds. */
const LONG_RUN_THRESHOLD_S = 30;

/** Formats a whole number of seconds as a human elapsed label (e.g. "1m 05s"). */
function formatElapsed(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
}

/** Output formats offered by the "Convert Image Format" tool. */
const IMAGE_FORMAT_OPTIONS = ["png", "jpg", "webp", "gif", "avif", "tiff"] as const;

/** Compression presets (label + quality 10-100) for the "Compress Images" tool. */
const QUALITY_OPTIONS = [
  { label: "High", value: 90 },
  { label: "Balanced", value: 75 },
  { label: "Small", value: 50 },
] as const;

type Stage = "select" | "converting" | "done" | "error" | "unsupported";

// ── helpers (module scope) ───────────────────────────────────────────────────
function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.[^.]+$/);
  return m ? m[0] : "";
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "output";
}

function isImageTool(tool: Tool): boolean {
  return (
    tool.editor === "image" ||
    (tool.acceptedFormats.length > 0 &&
      tool.acceptedFormats.every((f) => IMAGE_EXTS.includes(f)))
  );
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Produces a real, shareable output file for the mock conversion. No network is
 * involved while `USE_MOCK_DATA` is true. PDF/image results resolve to the
 * bundled sample asset matching the tool's output format; text results are
 * generated on-device.
 */
async function materializeOutput(
  name: string,
  sampleKey: ConversionResult["sampleKey"],
  tool: Tool,
  files: PickedFile[],
): Promise<string> {
  if (sampleKey === "pdf" || sampleKey === "image") {
    const asset = Asset.fromModule(SAMPLE_ASSETS[sampleKey]);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
  }
  const file = new File(Paths.cache, sanitizeName(name));
  file.create({ overwrite: true, intermediates: true });
  file.write(
    `PDF Convert Master — sample output\n` +
      `Tool: ${tool.title}\n` +
      `Output: ${name}\n` +
      `Source: ${files.map((f) => f.name).join(", ")}\n` +
      `Generated: ${new Date().toISOString()}\n`,
  );
  return file.uri;
}

function absoluteDownloadUrl(downloadUrl: string): string {
  if (/^https?:\/\//.test(downloadUrl)) return downloadUrl;
  return `${API_ORIGIN}${downloadUrl}`;
}

/**
 * Fetches the converted file from the backend and returns a shareable local
 * URI. On web we materialize a blob object-URL; on native we stream the bytes
 * to a unique cache file via expo-file-system so Sharing can hand off a path.
 */
async function downloadOutput(downloadUrl: string, name: string): Promise<string> {
  const url = absoluteDownloadUrl(downloadUrl);
  if (Platform.OS === "web") {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
  const dir = new Directory(Paths.cache, `convert-${Date.now()}`);
  dir.create({ intermediates: true });
  const dest = await File.downloadFileAsync(url, new File(dir, sanitizeName(name)));
  return dest.uri;
}

/**
 * Materializes a text-based file and returns a shareable URI. Web uses a blob
 * object-URL; native writes to the cache dir so Sharing can hand off the path.
 */
async function makeFileUri(
  content: string,
  name: string,
  mimeType = "text/plain",
): Promise<string> {
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    return URL.createObjectURL(blob);
  }
  const file = new File(Paths.cache, sanitizeName(name));
  file.create({ overwrite: true, intermediates: true });
  file.write(content);
  return file.uri;
}

// ── Download formats ──────────────────────────────────────────────────────────
/** Text-derived OCR export formats we can build on-device from recognized text. */
type OcrFormat = "pdf" | "doc" | "txt" | "html" | "md";

type FormatId =
  | "pdf"
  | "docx"
  | "doc"
  | "pptx"
  | "ppt"
  | "xlsx"
  | "xls"
  | "png"
  | "jpg"
  | "txt"
  | "html"
  | "md";

interface FormatDef {
  id: string;
  label: string;
  ext: string;
  mime: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}

/**
 * How a chosen download option is actually produced from the conversion result.
 *  - passthrough: hand back the file the server/mock already produced, unchanged.
 *  - reencode:    genuinely re-encode a single-image result to PNG/JPG on-device.
 *  - ocrText:     build a Word/TXT/HTML/Markdown file from the recognized OCR text.
 */
type ProduceKind =
  | { kind: "passthrough" }
  | { kind: "reencode"; to: "png" | "jpg" }
  | { kind: "ocrText"; fmt: OcrFormat };

type DownloadOption = FormatDef & { produce: ProduceKind };

/** Master registry of downloadable file formats (badge colour + icon per type). */
const FORMAT_REGISTRY: Record<FormatId, FormatDef> = {
  pdf: { id: "pdf", label: "PDF", ext: "pdf", mime: "application/pdf", color: "#f7433d", icon: "file-text" },
  docx: { id: "docx", label: "DOCX", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", color: "#2563eb", icon: "file-text" },
  doc: { id: "doc", label: "Word", ext: "doc", mime: "application/msword", color: "#2563eb", icon: "file-text" },
  pptx: { id: "pptx", label: "PPTX", ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", color: "#f97316", icon: "monitor" },
  ppt: { id: "ppt", label: "PPT", ext: "ppt", mime: "application/vnd.ms-powerpoint", color: "#f97316", icon: "monitor" },
  xlsx: { id: "xlsx", label: "XLSX", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", color: "#16a34a", icon: "grid" },
  xls: { id: "xls", label: "XLS", ext: "xls", mime: "application/vnd.ms-excel", color: "#16a34a", icon: "grid" },
  png: { id: "png", label: "PNG", ext: "png", mime: "image/png", color: "#a855f7", icon: "image" },
  jpg: { id: "jpg", label: "JPG", ext: "jpg", mime: "image/jpeg", color: "#a855f7", icon: "image" },
  txt: { id: "txt", label: "TXT", ext: "txt", mime: "text/plain", color: "#0ea5e9", icon: "file" },
  html: { id: "html", label: "HTML", ext: "html", mime: "text/html", color: "#f97316", icon: "code" },
  md: { id: "md", label: "Markdown", ext: "md", mime: "text/markdown", color: "#16a34a", icon: "hash" },
};

/** Tools whose result is a single raster image we can honestly re-encode to PNG/JPG. */
const SINGLE_IMAGE_TOOLS = new Set([
  "resize_image",
  "crop_image",
  "rotate_image",
  "convert_image_format",
  "compress_image",
  "upscale_image",
]);

/** Builds a passthrough option from the actual produced file's extension (falls
 *  back to the tool's declared output format when no result name is available). */
function passthroughFormat(tool: Tool, outputName?: string): FormatDef {
  const ext = outputName?.match(/\.([^./]+)$/)?.[1]?.toLowerCase();
  if (ext) {
    if (ext === "jpeg") return FORMAT_REGISTRY.jpg;
    const known = (FORMAT_REGISTRY as Record<string, FormatDef>)[ext];
    if (known) return known;
    return {
      id: ext,
      label: ext.toUpperCase(),
      ext,
      mime: "application/octet-stream",
      color: "#64748b",
      icon: ext === "zip" ? "archive" : "file",
    };
  }
  const out = tool.outputFormat.toLowerCase();
  if (out.includes("docx") || out.includes("word")) return FORMAT_REGISTRY.docx;
  if (out.includes("xlsx") || out.includes("excel")) return FORMAT_REGISTRY.xlsx;
  if (out.includes("pptx") || out.includes("powerpoint")) return FORMAT_REGISTRY.pptx;
  if (out.includes("png") || out.includes("jpg") || out.includes("image")) return FORMAT_REGISTRY.jpg;
  return FORMAT_REGISTRY.pdf;
}

/**
 * Computes the genuinely-deliverable download options for a tool's result:
 *  - OCR PDF: the searchable PDF the server built, plus Word/TXT/HTML/Markdown
 *    generated on-device from the recognized text (only when text is available).
 *  - Single-image tools: PNG/JPG, re-encoded on-device (PNG only when the result
 *    relies on transparency, since JPG can't preserve an alpha channel).
 *  - Everything else (documents, multi-image ZIPs, PDFs): the exact file the
 *    tool produced, passed through unchanged with its real extension.
 * We deliberately never offer a format we can't honestly create from the result.
 */
function getDownloadFormats(
  tool: Tool,
  opts: { outputName?: string; hasOcrText: boolean },
): DownloadOption[] {
  const opt = (f: FormatDef, produce: ProduceKind): DownloadOption => ({ ...f, produce });

  if (tool.serverToolType === "ocr_pdf") {
    const list: DownloadOption[] = [opt(FORMAT_REGISTRY.pdf, { kind: "passthrough" })];
    if (opts.hasOcrText) {
      list.push(
        opt(FORMAT_REGISTRY.doc, { kind: "ocrText", fmt: "doc" }),
        opt(FORMAT_REGISTRY.txt, { kind: "ocrText", fmt: "txt" }),
        opt(FORMAT_REGISTRY.html, { kind: "ocrText", fmt: "html" }),
        opt(FORMAT_REGISTRY.md, { kind: "ocrText", fmt: "md" }),
      );
    }
    return list;
  }

  const out = tool.outputFormat.toLowerCase();
  if (SINGLE_IMAGE_TOOLS.has(tool.serverToolType ?? "")) {
    if (out.includes("transparency")) return [opt(FORMAT_REGISTRY.png, { kind: "reencode", to: "png" })];
    return [
      opt(FORMAT_REGISTRY.png, { kind: "reencode", to: "png" }),
      opt(FORMAT_REGISTRY.jpg, { kind: "reencode", to: "jpg" }),
    ];
  }

  return [opt(passthroughFormat(tool, opts.outputName), { kind: "passthrough" })];
}

/** Re-encodes an image to PNG or JPG on-device (genuine pixel conversion). */
async function reencodeImage(uri: string, fmt: "png" | "jpg"): Promise<string> {
  const ref = await ImageManipulator.manipulate(uri).renderAsync();
  const result = await ref.saveAsync({
    format: fmt === "png" ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 0.92,
  });
  return result.uri;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Builds the file contents for a text-derived OCR export format. */
function buildOcrContent(format: OcrFormat, pages: string[], title: string): string {
  const trimmed = pages.map((p) => p.trim());
  switch (format) {
    case "md":
      return trimmed.map((t, i) => `## Page ${i + 1}\n\n${t}`).join("\n\n");
    case "html":
    case "doc": {
      const head =
        format === "doc"
          ? `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>`
          : `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font-family:sans-serif">`;
      const body = trimmed
        .map(
          (t, i) =>
            `<h2>Page ${i + 1}</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${escapeHtml(t)}</pre>`,
        )
        .join("\n");
      return `${head}${body}</body></html>`;
    }
    case "txt":
    default:
      return trimmed.map((t, i) => `--- Page ${i + 1} ---\n${t}`).join("\n\n");
  }
}

async function shareFile(uri: string, name: string): Promise<boolean> {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = uri;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Release blob object-URLs once the download has been kicked off so repeated
    // exports don't leak memory across a long web session.
    if (uri.startsWith("blob:")) {
      setTimeout(() => URL.revokeObjectURL(uri), 4000);
    }
    return true;
  }
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
}

// ── screen ───────────────────────────────────────────────────────────────────
export default function ConvertScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toolId, preview } = useLocalSearchParams<{ toolId: string; preview?: string }>();
  const tool = getToolById(toolId);

  // `preview` drives the canvas gallery: it initializes a specific stage so the
  // success / error / processing states can be shown as standalone frames.
  const previewStage: Stage | null =
    preview === "processing" || preview === "converting"
      ? "converting"
      : preview === "success" || preview === "done" || preview === "download"
        ? "done"
        : preview === "error"
          ? "error"
          : preview === "unsupported"
            ? "unsupported"
            : null;

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [stage, setStage] = useState<Stage>(previewStage ?? "select");
  const [error, setError] = useState<string | null>(
    previewStage === "error"
      ? "That file format isn't supported. Please choose a different file."
      : previewStage === "unsupported"
        ? "That file type isn't supported by this tool. Please choose a different file."
        : null,
  );
  const [output, setOutput] = useState<{ uri: string; name: string } | null>(
    previewStage === "done" ? { uri: "", name: "converted-document.docx" } : null,
  );
  const [outputFormat, setOutputFormat] = useState<string>("png");
  const [quality, setQuality] = useState<number>(75);
  const [ocrPages, setOcrPages] = useState<string[] | null>(
    previewStage === "done" && tool?.serverToolType === "ocr_pdf"
      ? [
          "Total withdrawals -$5,415.20\nTotal deposits $5,475.00\nBanking services provided by Choice Financial Group, Member FDIC.",
          "All Transactions\nDate (UTC) Description Type Amount End of Day Balance\nFeb 17 ACH transfer $59.83",
        ]
      : null,
  );
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPage, setCopiedPage] = useState<number | null>(null);
  const [ocrPageIndex, setOcrPageIndex] = useState(0);
  const [downloadOpen, setDownloadOpen] = useState(preview === "download");
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [fileName, setFileName] = useState("");

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.tools as never);
  }, [router]);

  // Track real elapsed processing time so we can show the actual waiting time
  // (no fake estimates) and reassure the user on long runs. Works for every tool.
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (stage !== "converting") {
      setElapsedSec(0);
      return;
    }
    const startedAt = Date.now();
    setElapsedSec(0);
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  const pickFiles = useCallback(async () => {
    if (!tool) return;
    setError(null);
    try {
      let picked: PickedFile[] = [];
      const imageTool = isImageTool(tool);

      if (imageTool) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError("Photo library access is required to choose images.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: tool.multiFile,
          quality: 1,
        });
        if (res.canceled) return;
        picked = res.assets.map((a, i) => ({
          uri: a.uri,
          name: a.fileName ?? `image-${Date.now()}-${i + 1}.jpg`,
          size: a.fileSize,
          mimeType: a.mimeType,
        }));
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: tool.multiFile,
          copyToCacheDirectory: true,
        });
        if (res.canceled) return;
        picked = res.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          size: a.size ?? undefined,
          mimeType: a.mimeType,
        }));
      }

      const valid: PickedFile[] = [];
      for (const f of picked) {
        const ext = extOf(f.name);
        if (
          !imageTool &&
          tool.acceptedFormats.length > 0 &&
          ext &&
          !tool.acceptedFormats.includes(ext)
        ) {
          setError(
            `This tool doesn't support ${ext} files. Accepted formats: ${tool.acceptedFormats.join(", ")}.`,
          );
          setStage("unsupported");
          return;
        }
        if (f.size && f.size > tool.maxFileSizeMB * 1024 * 1024) {
          setError(`"${f.name}" exceeds the ${tool.maxFileSize} limit.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Editor tools hand off to the interactive editor with the picked file.
      if (tool.editor === "pdf" || tool.editor === "image") {
        const pathname = tool.editor === "pdf" ? ROUTES.pdfEditor : ROUTES.imageEditor;
        router.push({
          pathname,
          params: { toolId: tool.id, uri: valid[0].uri, name: valid[0].name },
        } as never);
        return;
      }

      setFiles((prev) => (tool.multiFile ? [...prev, ...valid] : valid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not pick a file.");
    }
  }, [tool, router]);

  const convert = useCallback(async () => {
    if (!tool || files.length === 0) return;
    setStage("converting");
    setError(null);
    try {
      const options: ConversionOptions = {};
      if (tool.id === "convert-image-format") options.outputFormat = outputFormat;
      if (tool.id === "compress-images") options.quality = quality;

      const { jobId } = await startConversion(tool.id, files, options);
      const result = await getConversionResult(tool.id, jobId, files[0].name);
      if (result.status !== "completed") {
        throw new Error(result.error ?? "Conversion failed. Please try again.");
      }
      const name = result.outputFilename ?? sanitizeName(`output-${tool.id}`);
      const uri = result.downloadUrl
        ? await downloadOutput(result.downloadUrl, name)
        : await materializeOutput(name, result.sampleKey, tool, files);
      setOutput({ uri, name });
      setOcrPages(result.ocrPages && result.ocrPages.length > 0 ? result.ocrPages : null);
      setOcrPageIndex(0);
      setStage("done");
      // Refresh the user's real usage stats so the dashboard/usage screens
      // reflect this conversion without waiting for a remount.
      queryClient.invalidateQueries({ queryKey: ["account-usage"] });
      queryClient.invalidateQueries({ queryKey: ["usage-stats-real"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await addHistory({
        id: `h_${Date.now()}`,
        toolId: tool.id,
        toolTitle: tool.title,
        fileName: name,
        outputFormat: tool.outputFormat,
        timestamp: Date.now(),
        status: "completed",
      });
      await addFile({
        id: `f_${Date.now()}`,
        kind: tool.outputFormat.toLowerCase().includes("pdf")
          ? "converted-pdf"
          : "converted-file",
        name,
        uri,
        elementCount: files.length,
        createdAt: Date.now(),
        toolId: tool.id,
        toolTitle: tool.title,
        outputFormat: tool.outputFormat,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
      setStage("error");
    }
  }, [tool, files, outputFormat, quality]);

  const reset = useCallback(() => {
    setFiles([]);
    setOutput(null);
    setOcrPages(null);
    setOcrPageIndex(0);
    setCopiedAll(false);
    setCopiedPage(null);
    setDownloadOpen(false);
    setError(null);
    setStage("select");
  }, []);

  const onCopyAll = useCallback(async () => {
    if (!ocrPages) return;
    await Clipboard.setStringAsync(ocrPages.map((t) => t.trim()).join("\n\n"));
    setCopiedAll(true);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setTimeout(() => setCopiedAll(false), 1500);
  }, [ocrPages]);

  const onCopyPage = useCallback(
    async (index: number) => {
      if (!ocrPages) return;
      await Clipboard.setStringAsync((ocrPages[index] ?? "").trim());
      setCopiedPage(index);
      if (Platform.OS !== "web") Haptics.selectionAsync();
      setTimeout(() => setCopiedPage(null), 1500);
    },
    [ocrPages],
  );

  const prevPage = useCallback(() => {
    setOcrPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const nextPage = useCallback(() => {
    setOcrPageIndex((i) =>
      ocrPages ? Math.min(ocrPages.length - 1, i + 1) : i,
    );
  }, [ocrPages]);

  const openDownload = useCallback(() => {
    if (!tool) return;
    const base =
      (output?.name ?? "output").replace(/\.[^./]+$/, "") || "output";
    setFileName(base);
    setSelectedFormat(
      getDownloadFormats(tool, { outputName: output?.name, hasOcrText: !!ocrPages })[0].id,
    );
    setDownloadOpen(true);
  }, [output, tool, ocrPages]);

  const onConfirmDownload = useCallback(async () => {
    if (!tool || !output) return;
    const formats = getDownloadFormats(tool, {
      outputName: output.name,
      hasOcrText: !!ocrPages,
    });
    const fmt = formats.find((f) => f.id === selectedFormat) ?? formats[0];
    const base = (fileName.trim() || "output").replace(/\.[^./]+$/, "") || "output";
    const fullName = `${base}.${fmt.ext}`;
    setDownloadOpen(false);
    try {
      let uri: string;
      switch (fmt.produce.kind) {
        case "ocrText":
          // Word/TXT/HTML/Markdown built on-device from the recognized text.
          uri = ocrPages
            ? await makeFileUri(buildOcrContent(fmt.produce.fmt, ocrPages, base), fullName, fmt.mime)
            : output.uri;
          break;
        case "reencode":
          // Genuine pixel re-encode of a single-image result.
          uri = output.uri ? await reencodeImage(output.uri, fmt.produce.to) : output.uri;
          break;
        default:
          // Hand back the exact file the tool produced (document / PDF / ZIP).
          uri = output.uri;
      }
      const ok = await shareFile(uri, fullName);
      if (!ok) setError("Sharing isn't available on this platform.");
    } catch {
      setError("Could not prepare the download.");
    }
  }, [tool, output, ocrPages, selectedFormat, fileName]);

  const removeFile = useCallback((uri: string) => {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  }, []);

  if (!tool) {
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} />
        <View style={styles.emptyState}>
          <Feather name="alert-triangle" size={40} color={C.border} />
          <Text style={styles.emptyTitle}>Tool not found</Text>
          <Text style={styles.emptyText}>
            We couldn&apos;t find that tool. Head back and pick another one.
          </Text>
          <Button label="Browse tools" icon="grid" onPress={() => router.replace(ROUTES.tools as never)} />
        </View>
      </ScreenScroll>
    );
  }

  const isEditorTool = tool.editor === "pdf" || tool.editor === "image";

  const downloadFormats = getDownloadFormats(tool, {
    outputName: output?.name,
    hasOcrText: !!ocrPages,
  });
  const activeFormat =
    downloadFormats.find((f) => f.id === selectedFormat) ?? downloadFormats[0];
  const previewName = `${(fileName.trim() || "output").replace(/\.[^./]+$/, "") || "output"}.${activeFormat.ext}`;

  return (
    <>
    <ScreenScroll insetTop>
      <BackRow onPress={goBack} title={tool.title} />

      {/* Select stage */}
      {stage === "select" && (
        <View style={{ gap: 16 }}>
          <Pressable
            onPress={pickFiles}
            style={({ pressed }) => [styles.dropzone, { opacity: pressed ? 0.92 : 1 }]}
            testID="button-pick-file"
          >
            <View style={styles.dropIcon}>
              <ConverterStatusIcon status="upload" toolId={tool.id} size={52} />
            </View>
            <Text style={styles.dropTitle}>{tool.dropAreaText}</Text>
            <Text style={styles.dropHint}>{tool.fileTypeHint}</Text>
            <View style={styles.dropBtn}>
              <Feather name="folder" size={16} color={C.primaryForeground} />
              <Text style={styles.dropBtnText}>{tool.buttonText}</Text>
            </View>
            {isEditorTool && (
              <Text style={styles.editorHint}>
                Opens the {tool.editor === "pdf" ? "PDF" : "image"} editor after you choose a file.
              </Text>
            )}
          </Pressable>

          {error ? (
            <Text style={styles.errorText} testID="text-error">
              {error}
            </Text>
          ) : null}

          {files.length > 0 && (
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </Text>
                <Pressable onPress={reset} hitSlop={8} testID="button-clear-all">
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginTop: 12 }}>
                {files.map((f) => (
                  <View key={f.uri} style={styles.fileRow} testID={`row-file-${f.name}`}>
                    <View style={styles.fileIcon}>
                      <Feather name="file" size={18} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={styles.fileMeta}>{formatBytes(f.size)}</Text>
                    </View>
                    <Pressable
                      onPress={() => removeFile(f.uri)}
                      hitSlop={8}
                      testID={`button-remove-${f.name}`}
                    >
                      <Feather name="x" size={18} color={C.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>

              {tool.id === "convert-image-format" && (
                <View style={styles.optionBlock}>
                  <Text style={styles.optionLabel}>Output format</Text>
                  <View style={styles.chipRow}>
                    {IMAGE_FORMAT_OPTIONS.map((fmt) => {
                      const active = outputFormat === fmt;
                      return (
                        <Pressable
                          key={fmt}
                          onPress={() => setOutputFormat(fmt)}
                          style={[styles.chip, active && styles.chipActive]}
                          testID={`chip-format-${fmt}`}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {fmt.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {tool.id === "compress-images" && (
                <View style={styles.optionBlock}>
                  <Text style={styles.optionLabel}>Compression level</Text>
                  <View style={styles.chipRow}>
                    {QUALITY_OPTIONS.map((q) => {
                      const active = quality === q.value;
                      return (
                        <Pressable
                          key={q.value}
                          onPress={() => setQuality(q.value)}
                          style={[styles.chip, active && styles.chipActive]}
                          testID={`chip-quality-${q.value}`}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {q.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={{ gap: 10, marginTop: 16 }}>
                <Button
                  label={getToolActionLabel(tool)}
                  icon="zap"
                  fullWidth
                  onPress={convert}
                  testID="button-convert"
                />
                {tool.multiFile && (
                  <Button
                    label="Add more files"
                    icon="plus"
                    variant="outline"
                    fullWidth
                    onPress={pickFiles}
                    testID="button-add-more"
                  />
                )}
              </View>
            </Card>
          )}
        </View>
      )}

      {/* Converting stage */}
      {stage === "converting" && (
        <View style={styles.centerState} testID="status-converting">
          <ConverterStatusIcon status="processing" size={96} />
          <Text style={styles.centerTitle}>Converting…</Text>
          <Text style={styles.centerText}>
            Processing your file{files.length !== 1 ? "s" : ""} with {tool.title}.
          </Text>
          <Text style={styles.elapsedText} testID="text-elapsed">
            {`Time elapsed: ${formatElapsed(elapsedSec)}`}
          </Text>
          {elapsedSec >= LONG_RUN_THRESHOLD_S && (
            <View style={styles.longRunBox} testID="text-taking-longer">
              <Text style={styles.longRunTitle}>This is taking longer than usual.</Text>
              <Text style={styles.longRunText}>
                Hang tight — larger files can take a little while.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Done stage */}
      {stage === "done" && output && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="success" size={88} />
            <Text style={styles.successTitle} testID="text-success">
              Conversion complete
            </Text>
            <Text style={styles.successText}>Your file is ready to download.</Text>

            <View style={styles.outputRow}>
              <Feather name="file-text" size={18} color={C.primary} />
              <Text style={styles.outputName} numberOfLines={1} testID="text-output-name">
                {output.name}
              </Text>
            </View>

            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button
                label="Download"
                icon="download"
                fullWidth
                onPress={openDownload}
                testID="button-share"
              />
              <Button
                label="Convert another"
                icon="refresh-cw"
                variant="outline"
                fullWidth
                onPress={reset}
                testID="button-convert-another"
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </Card>
      )}

      {/* OCR recognized text panel */}
      {stage === "done" && ocrPages && ocrPages.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recognized text</Text>
            <Pressable onPress={onCopyAll} hitSlop={8} testID="button-copy-all">
              <View style={styles.ocrCopyBtn}>
                <Feather
                  name={copiedAll ? "check" : "copy"}
                  size={14}
                  color={C.primary}
                />
                <Text style={styles.ocrCopyText}>{copiedAll ? "Copied" : "Copy all"}</Text>
              </View>
            </Pressable>
          </View>
          <Text style={styles.ocrHint}>Tap the page to copy just its text.</Text>

          <Pressable
            onPress={() => onCopyPage(ocrPageIndex)}
            style={[styles.ocrPage, { marginTop: 12 }]}
            testID={`ocr-page-${ocrPageIndex + 1}`}
          >
            <View style={styles.ocrPageHeader}>
              <Text style={styles.ocrPageLabel}>Page {ocrPageIndex + 1}</Text>
              <Feather
                name={copiedPage === ocrPageIndex ? "check" : "copy"}
                size={13}
                color={copiedPage === ocrPageIndex ? C.primary : C.mutedForeground}
              />
            </View>
            <Text style={styles.ocrPageText} selectable>
              {(ocrPages[ocrPageIndex] ?? "").trim() ||
                "No text detected on this page."}
            </Text>
          </Pressable>

          <View style={styles.ocrNav}>
            <Pressable
              onPress={prevPage}
              disabled={ocrPageIndex === 0}
              hitSlop={8}
              style={[
                styles.ocrNavBtn,
                ocrPageIndex === 0 && styles.ocrNavBtnDisabled,
              ]}
              testID="button-ocr-prev"
            >
              <Feather
                name="chevron-left"
                size={16}
                color={ocrPageIndex === 0 ? C.mutedForeground : C.primary}
              />
              <Text
                style={[
                  styles.ocrNavText,
                  ocrPageIndex === 0 && styles.ocrNavTextDisabled,
                ]}
              >
                Back
              </Text>
            </Pressable>

            <Text style={styles.ocrNavLabel}>
              Page {ocrPageIndex + 1} of {ocrPages.length}
            </Text>

            <Pressable
              onPress={nextPage}
              disabled={ocrPageIndex >= ocrPages.length - 1}
              hitSlop={8}
              style={[
                styles.ocrNavBtn,
                ocrPageIndex >= ocrPages.length - 1 && styles.ocrNavBtnDisabled,
              ]}
              testID="button-ocr-next"
            >
              <Text
                style={[
                  styles.ocrNavText,
                  ocrPageIndex >= ocrPages.length - 1 &&
                    styles.ocrNavTextDisabled,
                ]}
              >
                Next
              </Text>
              <Feather
                name="chevron-right"
                size={16}
                color={
                  ocrPageIndex >= ocrPages.length - 1
                    ? C.mutedForeground
                    : C.primary
                }
              />
            </Pressable>
          </View>
        </Card>
      )}

      {/* Error stage */}
      {stage === "error" && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="error" size={88} />
            <Text style={styles.successTitle}>Something went wrong</Text>
            <Text style={styles.successText} testID="text-error">
              {error ?? "The conversion failed. Please try again."}
            </Text>
            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button label="Try again" icon="refresh-cw" fullWidth onPress={() => setStage("select")} testID="button-try-again" />
            </View>
          </View>
        </Card>
      )}

      {/* Unsupported file stage */}
      {stage === "unsupported" && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <FileBrokenIcon size={108} />
            <Text style={styles.successTitle}>Unsupported file</Text>
            <Text style={styles.successText} testID="text-unsupported">
              {error ?? "That file type isn't supported. Please choose a different file."}
            </Text>
            {tool.acceptedFormats.length > 0 ? (
              <Text style={styles.acceptedText}>
                Accepted: {tool.acceptedFormats.join(", ")}
              </Text>
            ) : null}
            <View style={{ gap: 10, width: "100%", marginTop: 16, alignItems: "center" }}>
              <Button
                label="Choose another file"
                icon="folder"
                onPress={() => {
                  setError(null);
                  setStage("select");
                }}
                style={{ alignSelf: "center" }}
                testID="button-choose-another"
              />
            </View>
          </View>
        </Card>
      )}
    </ScreenScroll>

      {/* Download format chooser (shared with the camera scanner) */}
      <DownloadFormatModal
        visible={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        subtitle={`Your ${tool.title} file is ready to download.`}
        sectionLabel="Download as:"
        formats={downloadFormats}
        selectedId={selectedFormat}
        onSelect={setSelectedFormat}
        confirmLabel="Download"
        confirmIcon="download"
        onConfirm={onConfirmDownload}
        fileName={fileName}
        onChangeFileName={setFileName}
        previewName={previewName}
      />
    </>
  );
}

// ── shared in-screen header ──────────────────────────────────────────────────
function BackRow({ onPress, title }: { onPress: () => void; title?: string }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        testID="button-back"
      >
        <Feather name="chevron-left" size={24} color={C.foreground} />
      </Pressable>
      {title ? (
        <Text style={styles.backTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.muted,
  },
  backTitle: { flex: 1, fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },

  hero: { alignItems: "center", gap: 8, marginBottom: 24 },
  iconTile: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
    marginTop: 4,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
  },

  dropzone: {
    borderWidth: 1.5,
    borderColor: C.blue200,
    borderStyle: "dashed",
    borderRadius: 18,
    backgroundColor: C.surfaceAlt,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  dropIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dropTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold, textAlign: "center" },
  dropHint: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  dropBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  dropBtnText: { color: C.primaryForeground, fontSize: 14, fontFamily: fonts.bodySemibold },
  editorHint: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center", marginTop: 4 },

  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  clearText: { fontSize: 13, color: C.destructive, fontFamily: fonts.bodySemibold },

  fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  fileMeta: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },

  centerState: { alignItems: "center", gap: 10, paddingVertical: 48 },
  elapsedText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium, textAlign: "center", marginTop: 4 },
  longRunBox: { alignItems: "center", gap: 4, marginTop: 16, paddingHorizontal: 24 },
  longRunTitle: { fontSize: 13.5, color: C.warning, fontFamily: fonts.headingSemibold, textAlign: "center" },
  longRunText: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  centerTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold, marginTop: 8 },
  centerText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  ocrCopyBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  ocrCopyText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },
  ocrHint: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 4 },
  ocrPage: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    padding: 12,
  },
  ocrPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ocrPageLabel: { fontSize: 12.5, color: C.foreground, fontFamily: fonts.bodySemibold },
  ocrPageText: { fontSize: 13.5, lineHeight: 20, color: C.foreground, fontFamily: fonts.body },
  ocrNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  ocrNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  ocrNavBtnDisabled: { opacity: 0.45 },
  ocrNavText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },
  ocrNavTextDisabled: { color: C.mutedForeground },
  ocrNavLabel: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium },

  successWrap: { alignItems: "center", gap: 6 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
  successText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  outputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    width: "100%",
    ...cardShadow,
  },
  outputName: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },

  optionBlock: { marginTop: 16, gap: 8 },
  optionLabel: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodySemibold },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyMedium },
  chipTextActive: { color: C.primaryForeground },

  errorText: { fontSize: 13, color: C.destructive, fontFamily: fonts.body, textAlign: "center", marginTop: 4 },
  acceptedText: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium, textAlign: "center", marginTop: 2 },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
});
