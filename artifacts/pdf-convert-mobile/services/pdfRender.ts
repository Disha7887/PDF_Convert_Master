import { API_BASE_URL } from "@/constants/api";

/**
 * Native PDF page rasterisation.
 *
 * Rasterising a PDF page to an image requires a DOM canvas (pdf.js), which only
 * exists on web. On native we instead upload the PDF to the api-server's
 * `/api/pdf/render-page` endpoint, which renders the requested page with
 * pdf-parse and returns a PNG data URL the editor can show directly. The web
 * rasteriser lives in `pdfRender.web.ts` (Metro picks it for web bundles only),
 * so pdf.js is never pulled into the native bundle.
 */

// Snap render widths to a few buckets so panning/zooming doesn't fire a fresh
// upload for every pixel and the cache below actually gets reused.
const WIDTH_BUCKETS = [160, 320, 640, 1280];
function bucketWidth(target: number): number {
  for (const b of WIDTH_BUCKETS) if (target <= b) return b;
  return WIDTH_BUCKETS[WIDTH_BUCKETS.length - 1];
}

// Small in-memory LRU of rendered pages, keyed by uri:pageIndex:bucket. Holds
// data URLs (a handful of visible pages + thumbnails); bounded so a long
// document can't grow it without limit.
const cache = new Map<string, Promise<string | null>>();
const MAX_CACHE = 16;

export async function renderPdfPage(
  uri: string,
  pageIndex: number,
  targetWidth: number,
): Promise<string | null> {
  if (!uri || pageIndex < 0) return null;
  if (!API_BASE_URL) return null;

  const width = bucketWidth(Math.max(80, Math.round(targetWidth)));
  const key = `${uri}::${pageIndex}::${width}`;

  const cached = cache.get(key);
  if (cached) {
    // Refresh LRU recency.
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const task = (async (): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append("file", {
        uri,
        name: "document.pdf",
        type: "application/pdf",
      } as unknown as Blob);
      form.append("pageIndex", String(pageIndex));
      form.append("targetWidth", String(width));

      const res = await fetch(`${API_BASE_URL}/pdf/render-page`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`render-page HTTP ${res.status}`);
      const json = (await res.json()) as { image?: string };
      return json.image ?? null;
    } catch {
      return null;
    }
  })();

  cache.set(key, task);
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  // Don't let a transient failure permanently poison this key's cache entry.
  task
    .then((v) => {
      if (v === null && cache.get(key) === task) cache.delete(key);
    })
    .catch(() => {
      if (cache.get(key) === task) cache.delete(key);
    });

  return task;
}

/**
 * Page size for aspect-ratio / coordinate normalisation. On native we have no
 * pdf.js, so callers fall back to pdf-lib's MediaBox (`getPdfPageSize`). The web
 * build overrides this with the pdf.js viewport size so the on-screen image,
 * text extraction and overlays all share one coordinate space.
 */
export async function getRenderPageSize(
  _uri: string,
  _pageIndex: number,
): Promise<{ width: number; height: number } | null> {
  return null;
}
