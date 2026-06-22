import { Feather } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

import type { Tool } from "@/constants/tools";

/**
 * Shared download-format logic used by every screen that lets the user save a
 * result: the conversion screen, the camera scanner, and the image/PDF editors.
 * Keeping it in one place means the "pick an output format" chooser behaves
 * identically everywhere and we only ever offer formats we can honestly produce.
 */

/** Removes characters that aren't safe in a file name across platforms. */
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "output";
}

/** Text-derived OCR export formats we can build on-device from recognized text. */
export type OcrFormat = "pdf" | "doc" | "txt" | "html" | "md";

export type FormatId =
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

export interface FormatDef {
  id: string;
  label: string;
  ext: string;
  mime: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}

/**
 * How a chosen download option is actually produced from the result.
 *  - passthrough: hand back the file the server/mock already produced, unchanged.
 *  - reencode:    genuinely re-encode a single-image result to PNG/JPG on-device.
 *  - ocrText:     build a Word/TXT/HTML/Markdown file from the recognized OCR text.
 */
export type ProduceKind =
  | { kind: "passthrough" }
  | { kind: "reencode"; to: "png" | "jpg" }
  | { kind: "ocrText"; fmt: OcrFormat };

export type DownloadOption = FormatDef & { produce: ProduceKind };

/** Master registry of downloadable file formats (badge colour + icon per type). */
export const FORMAT_REGISTRY: Record<FormatId, FormatDef> = {
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
export const SINGLE_IMAGE_TOOLS = new Set([
  "resize_image",
  "crop_image",
  "rotate_image",
  "convert_image_format",
  "compress_image",
  "upscale_image",
]);

/** Builds a passthrough option from the actual produced file's extension (falls
 *  back to the tool's declared output format when no result name is available). */
export function passthroughFormat(tool: Tool, outputName?: string): FormatDef {
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
export function getDownloadFormats(
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
export async function reencodeImage(uri: string, fmt: "png" | "jpg"): Promise<string> {
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
export function buildOcrContent(format: OcrFormat, pages: string[], title: string): string {
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

/**
 * Materializes a text-based file and returns a local file URI. Web uses a blob
 * object-URL; native writes to the cache dir so the save flow has a path to copy.
 */
export async function makeFileUri(
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

/**
 * Produces the final local URI for a chosen download option: re-encodes images,
 * builds OCR text files, or passes the original result through unchanged.
 */
export async function prepareDownloadUri(
  fmt: DownloadOption,
  ctx: {
    sourceUri: string;
    baseName: string;
    fullName: string;
    ocrPages?: string[] | null;
  },
): Promise<string> {
  switch (fmt.produce.kind) {
    case "ocrText":
      return ctx.ocrPages
        ? makeFileUri(buildOcrContent(fmt.produce.fmt, ctx.ocrPages, ctx.baseName), ctx.fullName, fmt.mime)
        : ctx.sourceUri;
    case "reencode":
      return ctx.sourceUri ? reencodeImage(ctx.sourceUri, fmt.produce.to) : ctx.sourceUri;
    default:
      return ctx.sourceUri;
  }
}
