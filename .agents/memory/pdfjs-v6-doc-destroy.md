---
name: pdf.js v6 removed PDFDocumentProxy.destroy()
description: In pdfjs-dist v6 the document proxy has no .destroy(); destroy via the loading task. A cleanup throw in finally can discard a successful extraction.
---

**pdf.js v6 (`pdfjs-dist@6`) removed `PDFDocumentProxy.destroy()`** — it is
`undefined`. `PDFDocumentLoadingTask.destroy()` and `page.cleanup()` still exist.

Cross-version-safe pattern:
```ts
const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
const doc = await loadingTask.promise;
try { /* getPage / getTextContent / render */ }
finally { try { await loadingTask.destroy(); } catch {} }  // NOT doc.destroy()
```

**Why this bit hard (the "Could not read this document's text." bug):** the
"Edit Text" extractor finished successfully (items extracted) but its `finally`
called `await doc.destroy()` → `TypeError: doc.destroy is not a function` → the
whole function rejected → caller showed the generic error. It failed on EVERY
real PDF, not specific ones. The page still RENDERED because the rasteriser
caches docs and never destroys them, so only the extraction path hit the broken
method — a classic "renders fine but Edit Text fails" split.

**Rules to apply:**
- Destroy pdf.js docs via the loading task, never `doc.destroy()`.
- Make cleanup in a `finally` best-effort (`try/catch`) so a cleanup failure can
  never propagate and throw away an already-successful result.
- **Verify against the version the APP resolves, not the repo root.** Here the
  root had `pdfjs-dist@4.7.76` but `artifacts/pdf-convert-mobile` resolved
  `6.0.227`. A Node repro using the root copy "passed" and hid a v6-only break.
  Reproduce inside the package dir: `node` an `.mjs` importing
  `pdfjs-dist/legacy/build/pdf.mjs` from within `artifacts/pdf-convert-mobile`.
- Harmless noise: v6 logs `Warning: ... standardFontDataUrl API parameter` —
  it's a warning, getTextContent still returns items; not the failure.
