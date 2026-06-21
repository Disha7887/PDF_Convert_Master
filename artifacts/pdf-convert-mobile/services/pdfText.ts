import type { PageTextItem } from "./pdfEditTypes";

/**
 * Native fallback for the PDF text engine.
 *
 * Reading the real, selectable text of a PDF (positions, fonts) needs pdf.js,
 * and sampling a run's ink colour needs a DOM canvas — both of which only exist
 * on web. On native this resolves to "no editable text", matching the native
 * page rasteriser (`pdfRender.ts`) which also returns null. The real engine
 * lives in `pdfText.web.ts`, so pdf.js is never pulled into the native bundle.
 */
export async function extractPageRuns(
  _uri: string,
  _pageIndex: number,
): Promise<PageTextItem[]> {
  return [];
}

export async function sampleTextColors(
  _pageDataUrl: string,
  _pageWidthPts: number,
  boxes: { x: number; y: number; width: number; height: number }[],
): Promise<string[]> {
  return boxes.map(() => "#111111");
}
