---
name: Watermark/overlay text fit on Expo web
description: How to size single-line overlay text so it fits a draggable box width on both native and web.
---

# Fitting single-line overlay text to a box width (pdf-convert-mobile)

The PDF watermark/signature overlays use a fixed-aspect `DraggableBox`; the box
height comes from `aspect` and the overlay font size is `boxWidthPx * aspect`.

**Rule (measure, don't guess):** size the box from the *measured* glyph width,
not a per-character length heuristic. Render a hidden `<Text>` (opacity 0,
absolutely positioned off-screen) with the same `fontFamily`/`letterSpacing` at a
reference font size (e.g. 100) and read `e.nativeEvent.layout.width` in
`onLayout` → `unit = width / 100` (width-per-point). Then
`aspect = clamp(0.8 / unit)` so the rendered text width = `unit * fontSize =
0.8 * boxW`, i.e. ~10% margin each side. A length-based guess
(`1/(L*k)`) was tried first and kept overflowing because the real advance varies
by font/string.

**Why:** `adjustsFontSizeToFit` does NOT work on Expo web (native only), so the
on-screen fit is governed entirely by the computed font size — there is no
auto-shrink safety net. Measuring the actual text is the only reliable fit.

**How to apply:** if a watermark/overlay clips or overflows the dashed box,
the hidden measurer + `0.8/unit` aspect is the source of truth; lower the `0.8`
for more margin. Also force `letterSpacing: 0` on the overlay (the base
`wmText` style sets `letterSpacing: 2`, which widens it). The pdf-lib builder
draws watermark text horizontally from `wmPlace`, sizing via
`helv.widthOfTextAtSize`, so builder output is exact regardless of the preview
approximation; only the on-screen preview needs the measurement.
