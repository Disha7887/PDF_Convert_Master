---
name: Watermark/overlay text fit on Expo web
description: How to size single-line overlay text so it fits a draggable box width on both native and web.
---

# Fitting single-line overlay text to a box width (pdf-convert-mobile)

The PDF watermark/signature overlays use a fixed-aspect `DraggableBox`; the box
height comes from `aspect` and the overlay font size is `boxWidthPx * aspect`.

**Rule:** size the text with a length-based box aspect, the same way the Sign
tool's `signAspect` does — `aspect = clamp(1 / textLength)` for the bold
watermark font, so font size = `boxW * aspect` and the rendered text lands at
~80% of the box width (fits with margin). Force `letterSpacing: 0` and
`numberOfLines={1}`.

**Why NOT to measure off-screen:** an earlier version rendered a hidden `<Text>`
at font size 100 and read `onLayout` width to compute an exact unit. This RACED
the web font load: the measurement ran with the *fallback* font (narrower),
produced too small a unit, and the overlay font came out too big — the watermark
overflowed its box on freshly-loaded / real PDF pages (it looked fine only when
the font was already cached). The Sign tool never had this bug because it uses
the simple length heuristic. Do not reintroduce a measuring `<Text>` unless you
also re-measure after fonts finish loading.

**Also:** `adjustsFontSizeToFit` does NOT work on Expo web (native only), so it
is not a safety net — the computed font size must be correct on its own.

**Builder parity:** the pdf-lib builder draws watermark text horizontally from
`wmPlace`, sizing via `helv.widthOfTextAtSize`, so the exported PDF is exact
regardless of the preview's approximation; only the on-screen preview uses the
length heuristic.
