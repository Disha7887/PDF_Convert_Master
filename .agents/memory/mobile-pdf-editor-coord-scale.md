---
name: Mobile PDF editor coordinate & scale model
description: How the pdf-convert-mobile editor keeps on-screen overlays, the page raster, and pdf-lib export in one consistent coordinate space (points, fractions, scale, rotation).
---

The mobile PDF editor (`artifacts/pdf-convert-mobile/app/editor/pdf.tsx`) stores
every overlay element's position as a **page fraction** (0..1, top-left origin)
and text `size` in **absolute PDF points**. Three things must agree on the same
unrotated, point-based coordinate space, or overlays drift from the rendered
page and/or the exported PDF:

1. **Text size is points, but must render to-scale on screen.**
   The page raster is shown in a preview box far narrower than the page's point
   width (~360px box vs ~595pt page → scale ≈ 0.6). Rendering text at raw
   `fontSize: el.size` px makes it ~1.7× too big and overlapping. Render text at
   `el.size * ptScale` where `ptScale = pageBox.width / pageWpts` (fall back to 1
   when the page width in points is unknown, e.g. the placeholder demo pages).
   **Why:** manual "add text" hid this latent bug because users pick size by eye;
   extracted ("Edit Text") runs carry true point sizes and exposed it. Mirrors the
   web editor's `fontSize: el.fontSize * zoom`.
   **How to apply:** keep `el.size` in points everywhere (export draws
   `size: el.size`, the properties SizeRow edits points); only the on-screen glyph
   gets `* ptScale`. Store the page's point width when you read `getPdfPageSize`.

2. **The draggable text wrapper (`DragMove`) has padding — compensate it.**
   `styles.dragMove` adds `paddingHorizontal/Vertical`, which shifts the glyph off
   the stored `(x, y)`. Offset the box by `-DRAG_PAD_H/-DRAG_PAD_V` so the glyph
   sits exactly at `(x, y)` while the selection border keeps its breathing room.
   **Why:** "Edit Text" places editable boxes precisely over whited-out original
   text; even a 4px shift is visible as "not in place." `DragMove` is text-only,
   so the offset is safe.

3. **Rasterize unrotated (`rotation: 0`).**
   `pdfRender.web.ts` must call `getViewport({ rotation: 0 })`. pdf-lib's
   `getPdfPageSize` / export draw in the unrotated MediaBox, and text extraction
   (`pdfText.web.ts`) uses `rotation: 0`. If the raster keeps a page's `/Rotate`,
   it renders sideways while overlays + export stay unrotated → every overlay and
   the page aspect misalign on rotated PDFs. Non-rotated pages are unaffected.

Round-trip sanity: pdf.js gives a top-left `y`; stored as fraction; pdf-lib draws
text baseline at `y = H*(1 - el.y) - el.size`. This is the same approximation the
web editor uses (`top = pageHeight - baseline - 0.82*fontSize`).
