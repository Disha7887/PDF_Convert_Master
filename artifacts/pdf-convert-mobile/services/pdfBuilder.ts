import { File, Paths } from "expo-file-system";
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

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
  signName?: string;
  signFont?: string;
  wmText?: string;
  wmOpacity?: number;
  imageUri?: string;
  imageScale?: number;
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
      bytes = await new File(srcUri).bytes();
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
  const bytes = await new File(uri).bytes();
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
        const { height } = page.getSize();
        let y = height - 60;
        for (const it of list) {
          page.drawText(sanitizeText(it.text), {
            x: 50,
            y,
            size: it.size,
            font: helv,
            color: hexToRgb(it.color),
          });
          y -= it.size + 14;
        }
      }
      break;
    }

    case "crop": {
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
      const name = (input.signName ?? "").trim();
      if (name) {
        const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
        const page = pages[input.activePage] ?? pages[pages.length - 1];
        const size = 24;
        const textW = oblique.widthOfTextAtSize(sanitizeText(name), size);
        const { width } = page.getSize();
        page.drawText(sanitizeText(name), {
          x: Math.max(40, width - textW - 50),
          y: 70,
          size,
          font: oblique,
          color: rgb(0.11, 0.14, 0.2),
        });
        page.drawLine({
          start: { x: Math.max(40, width - textW - 50), y: 62 },
          end: { x: width - 50, y: 62 },
          thickness: 1,
          color: rgb(0.6, 0.62, 0.66),
        });
      }
      break;
    }

    case "watermark": {
      const text = sanitizeText((input.wmText ?? "WATERMARK").trim() || "WATERMARK");
      const opacity = input.wmOpacity ?? 0.22;
      const size = 56;
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
        const scale = input.imageScale ?? 0.4;
        const drawW = (width - 100) * scale;
        const drawH = (drawW / embedded.width) * embedded.height;
        page.drawImage(embedded, {
          x: (width - drawW) / 2,
          y: (height - drawH) / 2,
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
  const file = new File(Paths.cache, sanitizeName(input.outName));
  file.create({ overwrite: true, intermediates: true });
  file.write(out);
  return file.uri;
}
