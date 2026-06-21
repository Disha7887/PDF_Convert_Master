import {
  degrees,
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import {
  type EditElement,
  type FontKey,
  type PageSlot,
  type Placement,
  type Rect,
} from "./pdfEditTypes";
import { readPdfBytes } from "./pdfDoc";
import { writePdfOutput } from "./pdfWrite";

export type { Placement, Rect } from "./pdfEditTypes";

/**
 * Real PDF generation for the unified mobile editor. The editor produces a flat
 * list of {@link EditElement}s plus an optional page arrangement; this module
 * turns them into genuine PDF bytes via pdf-lib (no copy-only / placeholder
 * output). Works in Expo Go (managed) — pdf-lib is pure JS and standard fonts
 * embed without fontkit.
 */

const A4: [number, number] = [595.28, 841.89];
const INK: RGB = rgb(0.11, 0.14, 0.2);

export interface WatermarkInput {
  text: string;
  opacity: number;
  place: Placement;
}

export interface BuildPdfInput {
  /** Source PDF picked by the user; when absent a real sample document is built. */
  srcUri?: string;
  /** Output filename (will be sanitised). */
  outName: string;
  /** Pages to create when there is no source document. */
  fallbackPageCount: number;
  /** Final page arrangement. When omitted the original order is kept verbatim. */
  pageOrder?: PageSlot[];
  /** Per-page annotations (each element references a page slot by key). */
  elements?: EditElement[];
  /** Text watermark stamped on every page. */
  watermark?: WatermarkInput | null;
  /** Crop rectangle (page fractions) applied to every page. */
  crop?: Rect | null;
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
  if (Number.isNaN(n)) return INK;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function stdFont(key: FontKey, bold: boolean, italic: boolean): StandardFonts {
  if (key === "times") {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (key === "courier") {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/** Lazily embeds + caches standard fonts so each is added to the doc only once. */
function makeFontCache(doc: PDFDocument) {
  const cache = new Map<string, PDFFont>();
  return async (key: FontKey, bold = false, italic = false): Promise<PDFFont> => {
    const name = stdFont(key, bold, italic);
    let f = cache.get(name);
    if (!f) {
      f = await doc.embedFont(name);
      cache.set(name, f);
    }
    return f;
  };
}

function drawSampleContent(page: PDFPage, font: PDFFont, index: number): void {
  const { width, height } = page.getSize();
  page.drawText(`Document — page ${index + 1}`, {
    x: 50,
    y: height - 70,
    size: 18,
    font,
    color: INK,
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
): Promise<PDFDocument> {
  if (srcUri) {
    // A real source was provided: never silently substitute a sample document.
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
    return doc;
  }
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    drawSampleContent(doc.addPage(A4), font, i);
  }
  return doc;
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

/** Builds the (re-arranged) output document by copying source pages in order. */
async function buildPages(
  src: PDFDocument,
  order: PageSlot[],
): Promise<PDFDocument> {
  const out = await PDFDocument.create();
  for (const slot of order) {
    let page: PDFPage;
    if (slot.src == null) {
      page = out.addPage(A4);
    } else {
      const [copied] = await out.copyPages(src, [slot.src]);
      page = out.addPage(copied);
    }
    if (slot.rotate) {
      const base = page.getRotation().angle;
      page.setRotation(degrees((base + slot.rotate) % 360));
    }
  }
  return out;
}

async function drawElement(
  doc: PDFDocument,
  page: PDFPage,
  el: EditElement,
  getFont: (k: FontKey, b?: boolean, i?: boolean) => Promise<PDFFont>,
): Promise<void> {
  const { width: W, height: H } = page.getSize();
  switch (el.kind) {
    case "text": {
      const font = await getFont(el.font, el.bold, el.italic);
      page.drawText(sanitizeText(el.text), {
        x: el.x * W,
        y: H * (1 - el.y) - el.size,
        size: el.size,
        font,
        color: hexToRgb(el.color),
      });
      return;
    }
    case "image": {
      const { bytes, isPng } = await imageBytesAndKind(el.uri);
      const emb = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const drawW = Math.max(8, el.w * W);
      const drawH = drawW * el.aspect;
      page.drawImage(emb, {
        x: el.x * W,
        y: H * (1 - el.y) - drawH,
        width: drawW,
        height: drawH,
      });
      return;
    }
    case "sign": {
      const targetW = Math.max(20, el.w * W);
      const yTop = H * (1 - el.y);
      const xL = el.x * W;
      if (el.mode === "draw" && el.paths?.length && el.padW) {
        const scale = targetW / el.padW;
        for (const d of el.paths) {
          page.drawSvgPath(d, {
            x: xL,
            y: yTop,
            scale,
            borderColor: INK,
            borderWidth: 1.8,
          });
        }
        return;
      }
      const name = (el.name ?? "").trim();
      if (name) {
        const font = await getFont("helvetica", false, true);
        const clean = sanitizeText(name);
        const baseW = font.widthOfTextAtSize(clean, 24) || 1;
        const size = Math.min(96, Math.max(8, (targetW / baseW) * 24));
        page.drawText(clean, { x: xL, y: yTop - size, size, font, color: INK });
      }
      return;
    }
    case "stamp": {
      const font = await getFont("helvetica", true, false);
      const boxW = Math.max(20, el.w * W);
      const boxH = boxW * el.aspect;
      const xL = el.x * W;
      const yTop = H * (1 - el.y);
      const col = hexToRgb(el.color);
      const label = sanitizeText(el.label.toUpperCase()) || "STAMP";
      const pad = boxH * 0.22;
      const baseW = font.widthOfTextAtSize(label, 24) || 1;
      const size = Math.max(
        6,
        Math.min(((boxW - pad * 2) / baseW) * 24, boxH - pad * 2),
      );
      page.drawRectangle({
        x: xL,
        y: yTop - boxH,
        width: boxW,
        height: boxH,
        borderColor: col,
        borderWidth: Math.max(1.5, boxH * 0.06),
      });
      const tw = font.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: xL + (boxW - tw) / 2,
        y: yTop - boxH / 2 - size * 0.34,
        size,
        font,
        color: col,
      });
      return;
    }
    case "rect": {
      const col = hexToRgb(el.color);
      page.drawRectangle({
        x: el.x * W,
        y: H * (1 - (el.y + el.h)),
        width: el.w * W,
        height: el.h * H,
        borderColor: col,
        borderWidth: el.strokeWidth,
        ...(el.fill ? { color: col, opacity: 0.25 } : {}),
      });
      return;
    }
    case "ellipse": {
      const col = hexToRgb(el.color);
      page.drawEllipse({
        x: (el.x + el.w / 2) * W,
        y: H * (1 - (el.y + el.h / 2)),
        xScale: (el.w * W) / 2,
        yScale: (el.h * H) / 2,
        borderColor: col,
        borderWidth: el.strokeWidth,
        ...(el.fill ? { color: col, opacity: 0.25 } : {}),
      });
      return;
    }
    case "highlight": {
      page.drawRectangle({
        x: el.x * W,
        y: H * (1 - (el.y + el.h)),
        width: el.w * W,
        height: el.h * H,
        color: hexToRgb(el.color),
        opacity: 0.35,
      });
      return;
    }
    case "whiteout": {
      page.drawRectangle({
        x: el.x * W,
        y: H * (1 - (el.y + el.h)),
        width: el.w * W,
        height: el.h * H,
        color: rgb(1, 1, 1),
      });
      return;
    }
    case "line":
    case "arrow": {
      const x1 = el.x * W;
      const y1 = H * (1 - el.y);
      const x2 = (el.x + el.w) * W;
      const y2 = H * (1 - (el.y + el.h));
      const col = hexToRgb(el.color);
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: el.strokeWidth,
        color: col,
      });
      if (el.kind === "arrow") {
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.max(8, el.strokeWidth * 4);
        for (const a of [ang + Math.PI * 0.82, ang - Math.PI * 0.82]) {
          page.drawLine({
            start: { x: x2, y: y2 },
            end: { x: x2 + len * Math.cos(a), y: y2 + len * Math.sin(a) },
            thickness: el.strokeWidth,
            color: col,
          });
        }
      }
      return;
    }
    case "draw": {
      const targetW = Math.max(8, el.w * W);
      const scale = el.padW > 0 ? targetW / el.padW : 1;
      const col = hexToRgb(el.color);
      for (const d of el.paths) {
        page.drawSvgPath(d, {
          x: el.x * W,
          y: H * (1 - el.y),
          scale,
          borderColor: col,
          borderWidth: el.strokeWidth,
        });
      }
      return;
    }
  }
}

export async function buildEditedPdf(input: BuildPdfInput): Promise<string> {
  const src = await loadOrCreateDoc(input.srcUri, input.fallbackPageCount);

  const order: PageSlot[] =
    input.pageOrder && input.pageOrder.length
      ? input.pageOrder
      : src.getPages().map((_, i) => ({ key: `s_${i}`, src: i, rotate: 0 as const }));

  if (order.length === 0) {
    throw new Error("Cannot save a document with no pages — keep at least one.");
  }

  const doc = await buildPages(src, order);
  const pages = doc.getPages();
  const getFont = makeFontCache(doc);

  // Per-page annotations.
  const slotIndex = new Map(order.map((s, i) => [s.key, i]));
  for (const el of input.elements ?? []) {
    const idx = slotIndex.get(el.slot);
    if (idx == null) continue;
    const page = pages[idx];
    if (!page) continue;
    await drawElement(doc, page, el, getFont);
  }

  // Watermark every page.
  const wm = input.watermark;
  if (wm && wm.text.trim()) {
    const helv = await getFont("helvetica");
    const text = sanitizeText(wm.text.trim());
    for (const page of pages) {
      const { width, height } = page.getSize();
      const targetW = Math.max(20, wm.place.w * width);
      const baseW = helv.widthOfTextAtSize(text, 24) || 1;
      const size = Math.min(160, Math.max(8, (targetW / baseW) * 24));
      page.drawText(text, {
        x: wm.place.x * width,
        y: height * (1 - wm.place.y) - size,
        size,
        font: helv,
        color: rgb(0.4, 0.42, 0.46),
        opacity: wm.opacity,
      });
    }
  }

  // Crop every page.
  const crop = input.crop;
  if (crop && (crop.x > 0 || crop.y > 0 || crop.w < 1 || crop.h < 1)) {
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.setCropBox(
        width * crop.x,
        height * (1 - (crop.y + crop.h)),
        width * crop.w,
        height * crop.h,
      );
    }
  }

  const out = await doc.save();
  return writePdfOutput(out, sanitizeName(input.outName));
}
