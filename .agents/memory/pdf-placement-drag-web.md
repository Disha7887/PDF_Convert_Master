---
name: Web PDF placement-box drag (Sign/Add-Image)
description: Why the placement box "can't move" and how to verify drag/resize e2e on the web PDF editor.
---

# Web PDF placement-box drag

`PdfPlacementCanvas.tsx` (used by SignPdf + AddImagePdf) renders a draggable/resizable
overlay box on a PDF page preview.

## Root cause of "I can't move" reports
Element-scoped pointer handlers + `setPointerCapture` on the box DROP pointermove
events once the pointer leaves the element — and especially when it crosses the
canvas-embedded iframe boundary. Result: box never moves.

**Fix (keep this shape):** register window-level `pointermove`/`pointerup`/`pointercancel`
ONCE in `useEffect([])`, read fresh props via a `latest` ref, and have `onPointerDown`
only record drag-start state (mode/startX/startY/orig/scale) in a ref. Do NOT go back to
element-scoped move listeners or `setPointerCapture`.
**Why:** long-lived window listeners keep firing no matter where the pointer travels.

## Verifying drag/resize e2e (this bit it me repeatedly)
- The placement box renders LOW on the page. The default Playwright viewport is
  1280x720, which puts the box BELOW the fold. `document.elementFromPoint(x,y)` returns
  `null` for points outside the viewport, so drags silently no-op and look "broken"
  when they're fine. Use a tall viewport (e.g. 1280x1500) AND
  `box.scrollIntoView({block:'center'})`, then re-read `getBoundingClientRect()` for
  viewport-relative mouse coords.
- Test MOVE and RESIZE SEPARATELY, each from the default top-left placement. A
  move-then-resize sequence pushes the box toward the page's right edge, where resize
  CORRECTLY clamps (`nw = min(orig.width+dx, page.width-orig.x)`) and produces no width
  growth — that's expected geometry, not a bug.
- Move math converts screen delta to PDF points via `scale = clientWidth/page.width`;
  positions clamp inside page bounds. Resize keeps aspect ratio.
