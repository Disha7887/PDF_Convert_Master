import { readPdfBytes } from "./pdfDoc";

/**
 * Web PDF page rasteriser using pdf.js. Renders a page to a PNG data URL for
 * on-screen preview/thumbnails. Mirrors the web app's pdfClient approach.
 */

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<any>; destroy: () => void };

let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // pdf.js needs a worker. We can't use Vite's `?url` import under Metro, so
      // point at the matching version on a CDN (configured once).
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

const docCache = new Map<string, Promise<PdfDoc>>();

async function loadDoc(uri: string): Promise<PdfDoc> {
  let cached = docCache.get(uri);
  if (!cached) {
    cached = (async () => {
      const pdfjs = await getPdfjs();
      const bytes = await readPdfBytes(uri);
      // pdf.js detaches the buffer it is given, so hand it a copy.
      return pdfjs.getDocument({ data: bytes.slice() }).promise as Promise<PdfDoc>;
    })();
    // Don't let a transient failure permanently poison this URI's cache entry.
    cached.catch(() => {
      if (docCache.get(uri) === cached) docCache.delete(uri);
    });
    docCache.set(uri, cached);
  }
  return cached;
}

export async function renderPdfPage(
  uri: string,
  pageIndex: number,
  targetWidth: number,
): Promise<string | null> {
  try {
    const doc = await loadDoc(uri);
    if (pageIndex < 0 || pageIndex >= doc.numPages) return null;
    const page = await doc.getPage(pageIndex + 1);
    // Render unrotated (rotation: 0) so the raster matches the coordinate space
    // used everywhere else: pdf-lib's unrotated MediaBox (getPdfPageSize / export
    // draw) and the text extraction in pdfText.web.ts. Without this, pages with a
    // /Rotate entry would raster sideways while overlays + export stay unrotated,
    // misaligning every overlay (and the page aspect) on rotated PDFs.
    const base = page.getViewport({ scale: 1, rotation: 0 });
    const scale = Math.max(0.2, targetWidth / base.width);
    const viewport = page.getViewport({ scale, rotation: 0 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
