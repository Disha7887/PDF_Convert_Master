import {
  FileText,
  Monitor,
  Table,
  Image as ImageIcon,
  File as FileIcon,
  Code,
  Hash,
  Archive,
  type LucideIcon,
} from "lucide-react";

import { authedFetch } from "@/lib/authedFetch";
import { downloadBlob, fetchFileBlob } from "@/lib/download";

/**
 * Shared download-format logic — the web mirror of the mobile app's
 * `services/downloadFormats.ts`. Keeping it in one place means the "pick an
 * output format" chooser behaves identically everywhere and we only ever offer
 * formats we can honestly produce from the result.
 */

/** Removes characters that aren't safe in a file name across platforms. */
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "output";
}

/** Text-derived OCR export formats we can build in-browser from recognized text. */
export type OcrFormat = "doc" | "txt" | "html" | "md";

export interface FormatDef {
  id: string;
  label: string;
  ext: string;
  mime: string;
  color: string;
  icon: LucideIcon;
}

/**
 * How a chosen download option is actually produced from the result.
 *  - passthrough: hand back the file the server already produced, unchanged.
 *  - reencode:    genuinely re-encode a single-image result to PNG/JPG in-browser.
 *  - ocrText:     build a Word/TXT/HTML/Markdown file from the recognized OCR text.
 */
export type ProduceKind =
  | { kind: "passthrough" }
  | { kind: "reencode"; to: "png" | "jpg" }
  | { kind: "ocrText"; fmt: OcrFormat };

export type DownloadOption = FormatDef & { produce: ProduceKind };

/** Master registry of downloadable file formats (badge colour + icon per type). */
export const FORMAT_REGISTRY: Record<string, FormatDef> = {
  pdf: { id: "pdf", label: "PDF", ext: "pdf", mime: "application/pdf", color: "#f7433d", icon: FileText },
  docx: { id: "docx", label: "DOCX", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", color: "#2563eb", icon: FileText },
  doc: { id: "doc", label: "Word", ext: "doc", mime: "application/msword", color: "#2563eb", icon: FileText },
  pptx: { id: "pptx", label: "PPTX", ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", color: "#f97316", icon: Monitor },
  ppt: { id: "ppt", label: "PPT", ext: "ppt", mime: "application/vnd.ms-powerpoint", color: "#f97316", icon: Monitor },
  xlsx: { id: "xlsx", label: "XLSX", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", color: "#16a34a", icon: Table },
  xls: { id: "xls", label: "XLS", ext: "xls", mime: "application/vnd.ms-excel", color: "#16a34a", icon: Table },
  png: { id: "png", label: "PNG", ext: "png", mime: "image/png", color: "#a855f7", icon: ImageIcon },
  jpg: { id: "jpg", label: "JPG", ext: "jpg", mime: "image/jpeg", color: "#a855f7", icon: ImageIcon },
  txt: { id: "txt", label: "TXT", ext: "txt", mime: "text/plain", color: "#0ea5e9", icon: FileIcon },
  html: { id: "html", label: "HTML", ext: "html", mime: "text/html", color: "#f97316", icon: Code },
  md: { id: "md", label: "Markdown", ext: "md", mime: "text/markdown", color: "#16a34a", icon: Hash },
  zip: { id: "zip", label: "ZIP", ext: "zip", mime: "application/zip", color: "#64748b", icon: Archive },
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

/** Builds a passthrough option from the produced file's extension (falls back to
 *  the tool's declared output-format label when no result name is available). */
export function passthroughFormat(outputFormat: string, outputName?: string): FormatDef {
  const ext = outputName?.match(/\.([^./]+)$/)?.[1]?.toLowerCase();
  if (ext) {
    if (ext === "jpeg") return FORMAT_REGISTRY.jpg;
    const known = FORMAT_REGISTRY[ext];
    if (known) return known;
    return {
      id: ext,
      label: ext.toUpperCase(),
      ext,
      mime: "application/octet-stream",
      color: "#64748b",
      icon: ext === "zip" ? Archive : FileIcon,
    };
  }
  const out = outputFormat.toLowerCase();
  if (out.includes("docx") || out.includes("word")) return FORMAT_REGISTRY.docx;
  if (out.includes("xlsx") || out.includes("excel")) return FORMAT_REGISTRY.xlsx;
  if (out.includes("pptx") || out.includes("powerpoint")) return FORMAT_REGISTRY.pptx;
  if (out.includes("zip") || out.includes("images")) return FORMAT_REGISTRY.zip;
  if (out.includes("png") || out.includes("jpg") || out.includes("image")) return FORMAT_REGISTRY.jpg;
  return FORMAT_REGISTRY.pdf;
}

/**
 * Computes the genuinely-deliverable download options for a tool's result:
 *  - OCR PDF: the searchable PDF the server built, plus Word/TXT/HTML/Markdown
 *    generated in-browser from the recognized text (only when text is available).
 *  - Single-image tools: PNG/JPG, re-encoded in-browser (PNG only when the result
 *    relies on transparency, since JPG can't preserve an alpha channel).
 *  - Everything else (documents, multi-image ZIPs, PDFs): the exact file the
 *    tool produced, passed through unchanged with its real extension.
 * We deliberately never offer a format we can't honestly create from the result.
 */
export function getDownloadFormats(opts: {
  serverToolType: string;
  outputFormat: string;
  outputName?: string;
  hasOcrText: boolean;
}): DownloadOption[] {
  const opt = (f: FormatDef, produce: ProduceKind): DownloadOption => ({ ...f, produce });

  if (opts.serverToolType === "ocr_pdf") {
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

  const out = opts.outputFormat.toLowerCase();
  if (SINGLE_IMAGE_TOOLS.has(opts.serverToolType)) {
    if (out.includes("transparency")) return [opt(FORMAT_REGISTRY.png, { kind: "reencode", to: "png" })];
    return [
      opt(FORMAT_REGISTRY.png, { kind: "reencode", to: "png" }),
      opt(FORMAT_REGISTRY.jpg, { kind: "reencode", to: "jpg" }),
    ];
  }

  return [opt(passthroughFormat(opts.outputFormat, opts.outputName), { kind: "passthrough" })];
}

/** Re-encodes the image at `url` to PNG or JPG in-browser (genuine pixel conversion). */
async function reencodeImage(url: string, fmt: "png" | "jpg"): Promise<Blob> {
  const { blob } = await fetchFileBlob(url);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't re-encode this image.");
  // JPG has no alpha channel — paint a white background so transparency doesn't
  // turn black.
  if (fmt === "jpg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, fmt === "png" ? "image/png" : "image/jpeg", 0.92),
  );
  if (!out) throw new Error("Could not re-encode the image.");
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

/** Fetches the per-page OCR text for a completed OCR job, if available. */
export async function fetchOcrText(jobId: number): Promise<string[]> {
  try {
    const res = await authedFetch(`/api/ocr-text/${jobId}`);
    if (!res.ok) return [];
    const payload = await res.json().catch(() => null);
    const pages = payload?.data?.pages;
    return Array.isArray(pages) ? pages : [];
  } catch {
    return [];
  }
}

/**
 * Produces the chosen download option and saves it to the user's device:
 * re-encodes images, builds OCR text files, or passes the original result
 * through unchanged — always saved under the user's chosen `fullName`.
 */
export async function produceDownload(
  option: DownloadOption,
  ctx: { downloadUrl: string; jobId: number; baseName: string; fullName: string },
): Promise<void> {
  switch (option.produce.kind) {
    case "ocrText": {
      const pages = await fetchOcrText(ctx.jobId);
      // The text formats are only ever offered when recognized text exists, but
      // it could expire between opening the chooser and confirming. Never save
      // the PDF under a .doc/.txt extension — that's dishonest; fail clearly so
      // the user can pick the PDF instead.
      if (pages.length === 0) {
        throw new Error("The recognized text isn't available anymore. Please download the PDF instead.");
      }
      const content = buildOcrContent(option.produce.fmt, pages, ctx.baseName);
      await downloadBlob(new Blob([content], { type: `${option.mime};charset=utf-8` }), ctx.fullName);
      return;
    }
    case "reencode": {
      const blob = await reencodeImage(ctx.downloadUrl, option.produce.to);
      await downloadBlob(blob, ctx.fullName);
      return;
    }
    default: {
      // Passthrough: fetch the produced file and save it under the chosen name
      // (so the user's edited filename wins over the server's Content-Disposition).
      const { blob } = await fetchFileBlob(ctx.downloadUrl);
      await downloadBlob(blob, ctx.fullName);
    }
  }
}
