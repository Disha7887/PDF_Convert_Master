import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import { readPdfBytes } from "./pdfDoc";
import { writePdfOutput } from "./pdfWrite";

/** Placement of a placed element, as fractions of the page (top-left origin). */
export interface Placement {
  /** Left edge, 0..1 of page width. */
  x: number;
  /** Top edge, 0..1 of page height (measured from the top). */
  y: number;
  /** Width, 0..1 of page width. */
  w: number;
}

/**
 * Real PDF generation for the mobile editor. Every editor mode resolves here and
 * produces genuine PDF bytes via pdf-lib (no copy-only / placeholder output).
 *
 * Works in Expo Go (managed) — pdf-lib is pure JS and standard fonts embed
 * without fontkit. Bytes are read/written with the expo-file-system `File` API.
 */

const A4: [number, number] = [595.28, 841.89];

export type EditorMode =
  | "edit"
  | "crop"
  | "sign"
  | "watermark"
  | "add-image"
  | "delete-pages";

export interface TextItemInput {
  page: number;
  text: string;
  size: number;
  color: string;
  /** Top-left position as page fractions (0..1). Defaults applied when absent. */
  x?: number;
  y?: number;
}

/** A crop rectangle expressed as page fractions (0..1) from the top-left. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BuildPdfInput {
  mode: EditorMode;
  /** Source PDF picked by the user; when absent a real sample document is built. */
  srcUri?: string;
  /** Output filename (will be sanitised). */
  outName: string;
  /** Pages to create when there is no source document. */
  fallbackPageCount: number;
  /** Page index currently shown in the editor (target for single-page edits). */
  activePage: number;

  textItems?: TextItemInput[];
  cropInset?: number;
  /** Free crop rectangle from the editor (takes precedence over cropInset). */
  cropRect?: CropRect;
  signName?: string;
  signFont?: string;
  /** Drawn signature: SVG path strings in pad-pixel space + pad dimensions. */
  signDraw?: { paths: string[]; width: number; height: number };
  /** Where the signature is placed/sized on the page (from the editor preview). */
  signPlace?: Placement;
  wmText?: string;
  wmOpacity?: number;
  /** Watermark font size in PDF points. */
  wmSize?: number;
  imageUri?: string;
  /** Where the image is placed/sized on the page (from the editor preview). */
  imagePlace?: Placement;
  deletedPages?: number[];
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document.pdf";
}

/** Standard fonts only support WinAnsi — drop anything outside Latin-1. */
function sanitizeText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[^\u0000-\u00FF]/g, "?");
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return rgb(0.11, 0.14, 0.2);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function drawSampleContent(page: PDFPage, font: PDFFont, index: number): void {
  const { width, height } = page.getSize();
  page.drawText(`Document — page ${index + 1}`, {
    x: 50,
    y: height - 70,
    size: 18,
    font,
    color: rgb(0.11, 0.14, 0.2),
  });
  const widths = [0.82, 0.72, 0.88, 0.6, 0.78, 0.7, 0.84, 0.66, 0.8];
  let y = height - 110;
  for (const w of widths) {
    page.drawRectangle({
      x: 50,
      y,
      width: (width - 100) * w,
      height: 8,
      color: rgb(0.9, 0.92, 0.95),
    });
    y -= 24;
  }
}

async function loadOrCreateDoc(
  srcUri: string | undefined,
  pageCount: number,
): Promise<{ doc: PDFDocument; created: boolean }> {
  if (srcUri) {
    // A real source was provided: never silently substitute a sample document.
    // Any read/parse failure must surface so we don't overwrite the user's file
    // with placeholder pages.
    let bytes: Uint8Array;
    try {
      bytes = await readPdfBytes(srcUri);
    } catch {
      throw new Error("Could not read the selected PDF. Please try again.");
    }
    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      throw new Error(
        "This PDF could not be opened — it may be corrupted or password-protected.",
      );
    }
    if (doc.getPageCount() === 0) {
      throw new Error("This PDF has no pages to edit.");
    }
    return { doc, created: false };
  }
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage(A4);
    drawSampleContent(page, font, i);
  }
  return { doc, created: true };
}

async function imageBytesAndKind(
  uri: string,
): Promise<{ bytes: Uint8Array; isPng: boolean }> {
  const bytes = await readPdfBytes(uri);
  const isPng =
    bytes.length > 3 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpg =
    bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpg) {
    throw new Error("Unsupported image format. Please choose a PNG or JPEG image.");
  }
  return { bytes, isPng };
}

export async function buildEditedPdf(input: BuildPdfInput): Promise<string> {
  const { doc } = await loadOrCreateDoc(input.srcUri, input.fallbackPageCount);
  const pages = doc.getPages();
  const helv = await doc.embedFont(StandardFonts.Helvetica);

  switch (input.mode) {
    case "edit": {
      const items = input.textItems ?? [];
      const byPage = new Map<number, TextItemInput[]>();
      for (const it of items) {
        const list = byPage.get(it.page) ?? [];
        list.push(it);
        byPage.set(it.page, list);
      }
      for (const [pageIdx, list] of byPage) {
        const page = pages[pageIdx];
        if (!page) continue;
        const { width, height } = page.getSize();
        let stack = height - 60;
        for (const it of list) {
          // Use the editor-supplied top-left placement when present; otherwise
          // fall back to a simple top-down stack.
          const hasPos = typeof it.x === "number" && typeof it.y === "number";
          const x = hasPos ? (it.x as number) * width : 50;
          const baseline = hasPos
            ? height * (1 - (it.y as number)) - it.size
            : stack;
          page.drawText(sanitizeText(it.text), {
            x,
            y: baseline,
            size: it.size,
            font: helv,
            color: hexToRgb(it.color),
          });
          stack -= it.size + 14;
        }
      }
      break;
    }

    case "crop": {
      const rect = input.cropRect;
      if (rect && (rect.x > 0 || rect.y > 0 || rect.w < 1 || rect.h < 1)) {
        for (const page of pages) {
          const { width, height } = page.getSize();
          page.setCropBox(
            width * rect.x,
            height * (1 - (rect.y + rect.h)),
            width * rect.w,
            height * rect.h,
          );
        }
        break;
      }
      const inset = input.cropInset ?? 0;
      if (inset > 0) {
        for (const page of pages) {
          const { width, height } = page.getSize();
          page.setCropBox(
            width * inset,
            height * inset,
            width * (1 - inset * 2),
            height * (1 - inset * 2),
          );
        }
      }
      break;
    }

    case "sign": {
      const draw = input.signDraw;
      const page = pages[input.activePage] ?? pages[pages.length - 1];
      const { width, height } = page.getSize();
      // Default placement (bottom-right) when the editor didn't supply one.
      const place = input.signPlace ?? { x: 0.55, y: 0.78, w: 0.4 };
      const targetW = Math.max(40, place.w * width);
      // Top of the placed box in PDF coords (y is bottom-up; place.y is from top).
      const yTopPdf = height * (1 - place.y);
      const xPdf = place.x * width;
      if (draw && draw.paths.length && draw.width > 0) {
        // Embed the drawn signature as vector strokes. pdf-lib's drawSvgPath
        // anchors the path at (x, y) with strokes extending downward, so the
        // box top maps directly to yTopPdf.
        const scale = targetW / draw.width;
        for (const d of draw.paths) {
          page.drawSvgPath(d, {
            x: xPdf,
            y: yTopPdf,
            scale,
            borderColor: rgb(0.11, 0.14, 0.2),
            borderWidth: 1.8,
          });
        }
        break;
      }
      const name = (input.signName ?? "").trim();
      if (name) {
        const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
        const clean = sanitizeText(name);
        // Size the text so it fills the placed box width.
        const baseW = oblique.widthOfTextAtSize(clean, 24) || 1;
        const size = Math.min(96, Math.max(8, (targetW / baseW) * 24));
        page.drawText(clean, {
          x: xPdf,
          y: yTopPdf - size,
          size,
          font: oblique,
          color: rgb(0.11, 0.14, 0.2),
        });
      }
      break;
    }

    case "watermark": {
      const text = sanitizeText((input.wmText ?? "WATERMARK").trim() || "WATERMARK");
      const opacity = input.wmOpacity ?? 0.22;
      const size = input.wmSize ?? 56;
      const angleDeg = 35;
      const rad = (angleDeg * Math.PI) / 180;
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textW = helv.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - (textW / 2) * Math.cos(rad),
          y: height / 2 - (textW / 2) * Math.sin(rad),
          size,
          font: helv,
          color: rgb(0.4, 0.42, 0.46),
          rotate: degrees(angleDeg),
          opacity,
        });
      }
      break;
    }

    case "add-image": {
      if (input.imageUri) {
        const { bytes, isPng } = await imageBytesAndKind(input.imageUri);
        const embedded = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = pages[input.activePage] ?? pages[0];
        const { width, height } = page.getSize();
        const place = input.imagePlace ?? { x: 0.3, y: 0.35, w: 0.4 };
        const drawW = Math.max(20, place.w * width);
        const drawH = (drawW / embedded.width) * embedded.height;
        const yTopPdf = height * (1 - place.y);
        page.drawImage(embedded, {
          x: place.x * width,
          y: yTopPdf - drawH,
          width: drawW,
          height: drawH,
        });
      }
      break;
    }

    case "delete-pages": {
      const total = doc.getPageCount();
      const toRemove = (input.deletedPages ?? [])
        .filter((i) => i >= 0 && i < total)
        .sort((a, b) => b - a);
      if (toRemove.length >= total) {
        throw new Error("Cannot delete every page — keep at least one.");
      }
      for (const idx of toRemove) doc.removePage(idx);
      break;
    }
  }

  const out = await doc.save();
  return writePdfOutput(out, sanitizeName(input.outName));
}
