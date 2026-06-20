---
name: pdf.js on Expo (web-only rasterization)
description: How real PDF page rendering is wired in pdf-convert-mobile and why pdfjs must stay web-only.
---

# pdf.js page rendering in pdf-convert-mobile

The on-device PDF editor (`app/editor/pdf.tsx`) renders REAL page previews and a
real page count from the user's picked PDF. Page count comes from `pdf-lib`
(`services/pdfDoc.ts`); page rasterization comes from pdf.js.

**Rule:** pdfjs-dist is imported ONLY from `services/pdfRender.web.ts`. The native
sibling `services/pdfRender.ts` is a stub returning `null`. Always import
`renderPdfPage` from `./pdfRender` (no extension) so Metro picks the platform file.

**Why:** pdfjs-dist + its worker cannot be bundled cleanly by Metro for native and
would crash/bloat the native bundle. Keeping it behind the `.web.ts` extension means
the native bundle never includes it; native falls back to a clean page frame.

**How to apply:**
- pdf.js worker is set via CDN: `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`. Vite's `?url` worker import does NOT work under Metro — use the CDN.
- Per-uri doc cache stores the `getDocument` promise; it self-evicts on rejection so a transient worker/network failure does not permanently poison a URI.
- `getDocument({ data: bytes.slice() })` — pass a COPY; pdf.js detaches the buffer.
- `PAGE_COUNT = 4` in the editor is only a fallback when no source `uri` is present.

# Drawn-or-typed signature
`components/SignaturePad.tsx` (react-native-svg + PanResponder) emits SVG path
strings + pad dims. `services/pdfBuilder.ts` embeds drawn strokes as vector via
`page.drawSvgPath` (scaled from pad width), and still supports typed signatures with
a font style. Both paths are wired through the editor's Draw/Type segmented toggle.
