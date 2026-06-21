import { API_BASE_URL } from "@/constants/api";
import type { FontKey, PageTextItem } from "./pdfEditTypes";

/**
 * Native PDF text engine for the "Edit Text" tool.
 *
 * Reading a page's real, selectable text (positions / fonts) needs pdf.js, and
 * sampling a run's ink colour needs a DOM canvas — both web-only. So on native
 * we upload the PDF to the api-server's `/api/pdf/extract-text` endpoint, which
 * runs the same pdf.js extraction the web editor does and samples each run's
 * colour server-side, returning ready-to-place editable runs. The web engine
 * (pdf.js in-browser) lives in `pdfText.web.ts`, so pdf.js is never pulled into
 * the native bundle. Mirrors the upload pattern in `pdfRender.ts`.
 */

// The endpoint also returns the pdf.js viewport size it extracted the runs in.
// Cache it so `getRenderPageSize` (services/pdfRender) can normalise overlay
// coordinates against the SAME space the runs use — matching the web path, where
// extraction, the rendered raster and overlays all share the pdf.js viewport.
const sizeCache = new Map<string, { width: number; height: number }>();

/** Last pdf.js viewport size seen for a page, or null if not yet extracted. */
export function getExtractedPageSize(
  uri: string,
  pageIndex: number,
): { width: number; height: number } | null {
  return sizeCache.get(`${uri}::${pageIndex}`) ?? null;
}

const ALLOWED_FONTS: ReadonlySet<FontKey> = new Set<FontKey>([
  "helvetica",
  "times",
  "courier",
]);
function asFontKey(v: unknown): FontKey {
  return typeof v === "string" && ALLOWED_FONTS.has(v as FontKey)
    ? (v as FontKey)
    : "helvetica";
}

interface ExtractResponse {
  items?: Array<Partial<PageTextItem>>;
  pageWidth?: number;
  pageHeight?: number;
}

export async function extractPageRuns(
  uri: string,
  pageIndex: number,
): Promise<PageTextItem[]> {
  if (!uri || pageIndex < 0 || !API_BASE_URL) return [];
  try {
    const form = new FormData();
    form.append("file", {
      uri,
      name: "document.pdf",
      type: "application/pdf",
    } as unknown as Blob);
    form.append("pageIndex", String(pageIndex));

    const res = await fetch(`${API_BASE_URL}/pdf/extract-text`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`extract-text HTTP ${res.status}`);
    const json = (await res.json()) as ExtractResponse;

    if (
      typeof json.pageWidth === "number" &&
      typeof json.pageHeight === "number" &&
      json.pageWidth > 0 &&
      json.pageHeight > 0
    ) {
      sizeCache.set(`${uri}::${pageIndex}`, {
        width: json.pageWidth,
        height: json.pageHeight,
      });
    }

    const items = Array.isArray(json.items) ? json.items : [];
    return items
      .filter((it) => typeof it.str === "string" && it.str.trim().length > 0)
      .map((it) => {
        const fontSize = Math.max(1, Number(it.fontSize) || 12);
        return {
          str: String(it.str),
          x: Number(it.x) || 0,
          y: Number(it.y) || 0,
          width: Math.max(1, Number(it.width) || 1),
          height: Math.max(1, Number(it.height) || fontSize),
          fontSize,
          family: asFontKey(it.family),
          bold: Boolean(it.bold),
          italic: Boolean(it.italic),
          color: typeof it.color === "string" ? it.color : undefined,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Native colour sampling fallback. Colours are sampled server-side and attached
 * to each run by `extractPageRuns`, so the editor uses those directly and this
 * is only hit if a run somehow arrived without one (then near-black).
 */
export async function sampleTextColors(
  _pageDataUrl: string,
  _pageWidthPts: number,
  boxes: { x: number; y: number; width: number; height: number }[],
): Promise<string[]> {
  return boxes.map(() => "#111111");
}
