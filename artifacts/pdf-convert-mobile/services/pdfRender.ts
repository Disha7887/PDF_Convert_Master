/**
 * Native fallback for PDF page rasterisation.
 *
 * Rasterising a PDF page to an image requires a DOM canvas (pdf.js), which only
 * exists on web. On native this resolves to `null` and the editor renders a
 * clean page frame with the real page number instead. The real rasteriser lives
 * in `pdfRender.web.ts`, which Metro picks for web bundles only — so pdf.js is
 * never pulled into the native bundle.
 */
export async function renderPdfPage(
  _uri: string,
  _pageIndex: number,
  _targetWidth: number,
): Promise<string | null> {
  return null;
}
