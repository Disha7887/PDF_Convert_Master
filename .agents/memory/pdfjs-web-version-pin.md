---
name: Web pdfjs-dist version pin
description: Why the web app pins pdfjs-dist to 5.4.296 and avoids v6.0.x
---

Pin `pdfjs-dist` in `artifacts/pdf-convert-master` to **5.4.296** (same exact version the api-server uses). Do NOT bump to v6.0.x.

**Why:** pdf.js **6.0.227** calls `Map.prototype.getOrInsertComputed` inside `PDFPageProxy.render` (via `getOptionalContentConfig` → `#cacheSimpleMethod`). `getOrInsertComputed` is an unshipped TC39 proposal, so real browsers throw `TypeError: ...getOrInsertComputed is not a function` and every client-side render fails with the toast "Could not open PDF — file may be corrupt or password-protected." v6 also removed `PDFDocumentProxy.destroy()` (`doc.destroy is not a function`). v5.4.296 predates both problems and matches the server, avoiding render-result drift.

**How to apply:** Keep web + api-server pdfjs in lockstep. To destroy a loaded doc use `doc.loadingTask.destroy()` (works in both v5 and v6), never `doc.destroy()`. The v5 worker file `pdfjs-dist/build/pdf.worker.min.mjs` exists and the `{canvasContext, viewport}` render API is unchanged from v5→v6, so no other code changes are needed when pinning down. All client-side editing tools share `renderPdfPages()` in `src/lib/pdfClient.ts`, so this one fix covers EditPdf/OcrPdf/AddImagePdf/CropPdf/etc.
