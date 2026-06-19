import { loadPdfDocument, loadImageElement } from "./pdfClient";

// A single text run extracted from a PDF page, expressed in PDF user-space
// points with a TOP-LEFT origin (matching the editor's element coordinates).
export interface PageTextItem {
  pageIndex: number;
  str: string;
  x: number; // left, points
  y: number; // top, points
  width: number; // points
  height: number; // points (~ font size)
  fontSize: number; // points
  family: "Helvetica" | "Times" | "Courier";
  bold: boolean;
  italic: boolean;
}

type Family = PageTextItem["family"];

// Map an arbitrary PostScript / CSS font name onto the three families the
// editor can re-embed with pdf-lib's standard fonts.
function familyFromName(name: string): Family {
  const n = name.toLowerCase();
  if (/(times|georgia|garamond|minion|serif)/.test(n) && !/sans/.test(n))
    return "Times";
  if (/(courier|mono|consol|menlo|typewriter)/.test(n)) return "Courier";
  return "Helvetica";
}

function isBoldName(name: string): boolean {
  return /(bold|black|heavy|semibold|demi|[^a-z]bd[^a-z]|w[6-9]00)/i.test(name);
}
function isItalicName(name: string): boolean {
  return /(italic|oblique|slant)/i.test(name);
}

/**
 * Extract every text run from a PDF, one array per page. Geometry is converted
 * to top-left-origin points so it lines up with the editor overlay and the
 * pdf-lib export path. Font family / weight / style are detected best-effort
 * from the embedded font descriptor (falling back to the text style record).
 */
export async function extractPageTexts(
  bytes: Uint8Array,
): Promise<PageTextItem[][]> {
  const doc = await loadPdfDocument(bytes);
  const out: PageTextItem[][] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      // Unrotated user space (rotation 0) so coordinates match the editor,
      // which renders pages with forceUnrotated.
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      const pageHeight = viewport.height;
      const content = await page.getTextContent();
      const styles: Record<string, any> = (content as any).styles ?? {};

      // Resolve a font name for each fontName key once (commonObjs is populated
      // lazily; guard every access since it throws when absent).
      const fontMeta = new Map<string, { family: Family; bold: boolean; italic: boolean }>();
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
          pageIndex: p - 1,
          str,
          x: left,
          y: Math.max(0, top),
          width: Math.max(width, 1),
          height: Math.max(height, fontSize),
          fontSize,
          ...meta,
        });
      }
      out.push(items);
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return out;
}

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => clampByte(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/**
 * Estimate the dominant ink colour of a text run by sampling the rendered page
 * raster within the run's bounding box. We collect the non-background pixels
 * (those noticeably darker / more saturated than the page) and average them.
 * Falls back to near-black when nothing stands out.
 */
export async function sampleTextColor(
  pageDataUrl: string,
  pageWidthPts: number,
  bbox: { x: number; y: number; width: number; height: number },
): Promise<string> {
  try {
    const img = await loadImageElement(pageDataUrl);
    const scale = img.naturalWidth / pageWidthPts; // px per point
    const sx = Math.max(0, Math.floor(bbox.x * scale));
    const sy = Math.max(0, Math.floor(bbox.y * scale));
    const sw = Math.max(1, Math.ceil(bbox.width * scale));
    const sh = Math.max(1, Math.ceil(bbox.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const { data } = ctx.getImageData(0, 0, sw, sh);

    // First pass: find the brightest pixel (assumed background).
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

// Find the text run whose box contains (or is closest to) a clicked point on a
// page. Used by the Edit-text tool.
export function findTextAt(
  items: PageTextItem[],
  x: number,
  y: number,
): PageTextItem | null {
  let hit: PageTextItem | null = null;
  for (const it of items) {
    const pad = it.fontSize * 0.35;
    if (
      x >= it.x - 2 &&
      x <= it.x + it.width + 2 &&
      y >= it.y - pad &&
      y <= it.y + it.height + pad
    ) {
      hit = it;
      break;
    }
  }
  if (hit) return hit;
  // fall back to nearest run by centre distance within a small radius
  let best: PageTextItem | null = null;
  let bestD = Infinity;
  for (const it of items) {
    const cx = it.x + it.width / 2;
    const cy = it.y + it.height / 2;
    const d = Math.hypot(cx - x, cy - y);
    if (d < bestD && d < Math.max(40, it.fontSize * 2)) {
      bestD = d;
      best = it;
    }
  }
  return best;
}
