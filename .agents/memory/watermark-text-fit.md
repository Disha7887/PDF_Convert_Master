---
name: Watermark/overlay text fit on Expo web
description: How to size single-line overlay text so it fits a draggable box width on both native and web.
---

# Fitting single-line overlay text to a box width (pdf-convert-mobile)

The PDF watermark/signature overlays use a fixed-aspect `DraggableBox`; the box
height comes from `aspect` and the text font size is `boxWidthPx * aspect`.

**Rule:** to make the text span (and stay inside) the box width, derive the box
aspect from text length: `aspect = 1 / (L * k)` where `L` is char count and `k`
is the font's average advance ratio. For the **uppercase bold** heading font we
ship, measured advance is ~0.72, so use `k ≈ 0.8` to leave a small margin
(text width ≈ boxW * 0.72/0.8 ≈ 0.9·boxW). Also force `letterSpacing: 0` on the
overlay text — the base `wmText` style has `letterSpacing: 2` which widens it.

**Why:** `adjustsFontSizeToFit` does NOT work on Expo web (only native), so the
length-based estimate is what actually governs fit in the preview. Keep
`adjustsFontSizeToFit` + `numberOfLines={1}` for native safety, but the estimate
must be correct on its own.

**How to apply:** if a watermark/overlay clips or overflows the dashed box,
adjust `k` upward (smaller font/more margin) — do not rely on auto-shrink.
The pdf-lib builder draws watermark text horizontally from `wmPlace`, sizing via
`helv.widthOfTextAtSize`, so builder output is exact regardless of the preview
approximation; only the on-screen preview needs the estimate.
