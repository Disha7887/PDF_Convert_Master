---
name: pdf-lib drawSvgPath Y-flip
description: How pdf-lib drawSvgPath maps SVG coords to PDF space; avoid double-flipping freehand/signature strokes.
---

# pdf-lib `drawSvgPath` already flips Y

`page.drawSvgPath(d, { x, y, scale })` internally emits `translate(x, y)` then
`scale(scale, -scale)` (verified in pdf-lib@1.17.1 cjs/api/operations.js, comment
"SVG path Y axis is opposite pdf-lib's"). So the SVG's `(0,0)` lands at `(x, y)`
in PDF space and **positive SVG-Y draws downward** (toward smaller PDF y).

**Rule:** anchor at the *top edge* of the target box in PDF coords —
`y = H * (1 - el.y)` (top, not bottom) — and the path renders right-side-up,
extending downward. Do **NOT** add your own Y negation or subtract the box
height; that double-flips and inverts/offsets the stroke off-page.

**Why:** freehand `draw` and drawn `sign` capture paths in screen/pad pixel space
(top-left origin, +Y down). Because drawSvgPath re-flips Y, that capture space
maps directly — preview (raw `d` in an RN-SVG of the same px space) and export
match without extra transforms. A reviewer flagged this as "missing Y-flip"; it
is not a bug.

**How to apply:** in `services/pdfBuilder.ts` keep `draw`/`sign` draw calls
anchored at `yTop` with `scale = targetW / padW`; full-page freehand uses
`el.x=el.y=0, padW=container.width` so the whole-canvas stroke maps 1:1.

# Editing happens in unrotated page space

Both web (`forceUnrotated: true`, comment "page keeps its /Rotate, so annotations
rotate together with content") and mobile edit on the *unrotated* raster and let
`page.setRotation()` apply the page's `/Rotate` to the whole page — content **and**
overlays rotate together. The editing preview intentionally shows pages unrotated;
this is parity-correct, not a preview/export divergence.

Undo/redo in both editors snapshots only `EditElement[]` (page reorder/rotate/
crop/watermark are intentionally outside history). Don't "fix" mobile to cover
page ops — that would diverge from web.
