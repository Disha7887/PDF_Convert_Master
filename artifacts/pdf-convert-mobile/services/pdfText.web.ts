import { readPdfBytes } from "./pdfDoc";
import type { FontKey, PageTextItem } from "./pdfEditTypes";

/**
 * Web text engine for the "Edit Text" tool. Uses pdf.js to read a page's real,
 * selectable text runs (position / size / font), and samples each run's ink
 * colour from the rendered page raster. Mirrors the web app's `lib/pdfText.ts`.
 * Metro picks this file for web bundles only, so pdf.js stays out of native.
 */

// Map an arbitrary PostScript / CSS font name onto the three families the
// editor can re-embed with pdf-lib's standard fonts.
function familyFromName(name: string): FontKey {
  const n = name.toLowerCase();
  if (/(times|georgia|garamond|minion|serif)/.test(n) && !/sans/.test(n))
    return "times";
  if (/(courier|mono|consol|menlo|typewriter)/.test(n)) return "courier";
  return "helvetica";
}
function isBoldName(name: string): boolean {
  return /(bold|black|heavy|semibold|demi|[^a-z]bd[^a-z]|w[6-9]00)/i.test(name);
}
function isItalicName(name: string): boolean {
  return /(italic|oblique|slant)/i.test(name);
}

let pdfjsPromise: Promise<any> | null = null;
async function getPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // Match the rasteriser: load the worker from a CDN (Vite's `?url` import
      // isn't available under Metro).
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/**
 * Extract every text run from a single page, in top-left-origin points so the
 * geometry lines up with the editor overlay and the pdf-lib export path. Font
 * family / weight / style are detected best-effort from the embedded font
 * descriptor (falling back to the text style record).
 */
export async function extractPageRuns(
  uri: string,
  pageIndex: number,
): Promise<PageTextItem[]> {
  const pdfjs = await getPdfjs();
  const bytes = await readPdfBytes(uri);
  // pdf.js detaches the buffer it is given, so hand it a copy.
  const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
  const doc = await loadingTask.promise;
  try {
    if (pageIndex < 0 || pageIndex >= doc.numPages) return [];
    const page = await doc.getPage(pageIndex + 1);
    // Unrotated user space (rotation 0) so coordinates match the editor overlay.
    const viewport = page.getViewport({ scale: 1, rotation: 0 });
    const pageHeight = viewport.height;
    const content = await page.getTextContent();
    const styles: Record<string, any> = (content as any).styles ?? {};

    // Resolve a font name for each fontName key once (commonObjs is populated
    // lazily; guard every access since it throws when absent).
    const fontMeta = new Map<
      string,
      { family: FontKey; bold: boolean; italic: boolean }
    >();
    const resolveFont = (fontName: string) => {
      if (fontMeta.has(fontName)) return fontMeta.get(fontName)!;
      let psName = "";
      try {
        const obj: any =
          (page as any).commonObjs?.has?.(fontName) &&
          (page as any).commonObjs.get(fontName);
        if (obj) psName = obj.name || obj.loadedName || "";
      } catch {
        /* font not resolved yet */
      }
      const style = styles[fontName];
      const cssName: string = style?.fontFamily || "";
      const probe = `${psName} ${cssName}`;
      const meta = {
        family: familyFromName(probe),
        bold: isBoldName(probe),
        italic: isItalicName(probe),
      };
      fontMeta.set(fontName, meta);
      return meta;
    };

    const items: PageTextItem[] = [];
    for (const raw of content.items as any[]) {
      const str: string = raw.str ?? "";
      if (!str || !str.trim()) continue;
      const tr: number[] = raw.transform; // [a,b,c,d,e,f]
      const fontSize = Math.hypot(tr[2], tr[3]) || Math.abs(tr[3]) || 12;
      const left = tr[4];
      const baseline = tr[5]; // distance from bottom
      const width: number = raw.width || fontSize * 0.5 * str.length;
      const height: number = raw.height || fontSize;
      // Glyph box top in top-left origin. The transform sits on the baseline,
      // so the visual top is roughly one font size above it.
      const top = pageHeight - baseline - fontSize * 0.82;
      const meta = resolveFont(raw.fontName ?? "");
      items.push({
        str,
        x: left,
        y: Math.max(0, top),
        width: Math.max(width, 1),
        height: Math.max(height, fontSize),
        fontSize,
        ...meta,
      });
    }
    page.cleanup();
    return items;
  } finally {
    // pdf.js v6 removed `PDFDocumentProxy.destroy()` — destroying must go through
    // the loading task. Best-effort: a cleanup failure must never propagate and
    // discard a successful extraction (that bug made "Edit Text" report
    // "Could not read this document's text." on every real PDF).
    try {
      await loadingTask.destroy();
    } catch {
      /* cleanup is best-effort */
    }
  }
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => clampByte(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode page image."));
    img.src = src;
  });
}

/**
 * Estimate the dominant ink colour of a text run by sampling the rendered page
 * raster within the run's bounding box: the brightest pixel is treated as the
 * page background, and pixels meaningfully darker than it (the "ink") are
 * averaged. Falls back to near-black when nothing stands out.
 */
function sampleBoxColor(
  img: HTMLImageElement,
  scale: number,
  bbox: { x: number; y: number; width: number; height: number },
): string {
  try {
    const sx = Math.max(0, Math.floor(bbox.x * scale));
    const sy = Math.max(0, Math.floor(bbox.y * scale));
    const sw = Math.max(1, Math.ceil(bbox.width * scale));
    const sh = Math.max(1, Math.ceil(bbox.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#111111";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const { data } = ctx.getImageData(0, 0, sw, sh);

    let bgLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum > bgLum) bgLum = lum;
    }
    const threshold = bgLum - 60; // ink is meaningfully darker than the page
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < threshold) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    if (n < 3) return "#111111";
    return toHex(r / n, g / n, b / n);
  } catch {
    return "#111111";
  }
}

// Decode the page image ONCE and sample many boxes, so a page with dozens of
// runs doesn't re-decode the raster per run.
export async function sampleTextColors(
  pageDataUrl: string,
  pageWidthPts: number,
  boxes: { x: number; y: number; width: number; height: number }[],
): Promise<string[]> {
  try {
    const img = await loadImageElement(pageDataUrl);
    const scale = img.naturalWidth / pageWidthPts; // px per point
    return boxes.map((b) => sampleBoxColor(img, scale, b));
  } catch {
    return boxes.map(() => "#111111");
  }
}
