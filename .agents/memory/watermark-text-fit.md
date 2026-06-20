---
name: Watermark/overlay text fit on Expo web
description: How to size single-line overlay text so it fits a draggable box width on both native and web.
---

# Fitting single-line overlay text to a box width (pdf-convert-mobile)

The PDF watermark/signature overlays live inside a fixed-aspect `DraggableBox`
(box height = box width × `aspect`).

**The trap:** the original overlays set `fontSize = boxW * aspect`, i.e. font
size is tied to the box *height*. To make a long string fit the *width*, you are
then forced to shrink `aspect` (`~1/len`), which makes the box a razor-thin band;
the single text line's line-height then exceeds the box height and pokes out past
the edges — looks like overflow even though the width math "fits". The Sign tool
only avoids this because its script font is narrow and names are short.

**Rule (decouple width-fit from box height; cap by BOTH):**
- Give the box its **own** comfortable height via `aspect ≈ 1.45/textLength`
  (clamped), so it is not a thin band.
- Set the font to the **smaller** of a width-fit and a height-fit cap so it can
  never overflow at any length or after resize:
  - width: `fontSize ≤ boxW * 0.9 / (len * 0.78)` — `0.78` ≈ **max** bold-cap
    advance (use the max, not the average, or wide-letter strings like "WWWW"
    slip past); then `textWidth = len*realAdvance*fontSize ≤ 0.9*boxW`.
  - height: `fontSize ≤ boxH / 1.3` (`1.3` = line height) — without this, the
    aspect clamp lets very short strings grow a font taller than the box.
  - `fontSize = max(6, min(widthCap, heightCap))`.
- Keep `letterSpacing: 0` and `numberOfLines={1}`.
- **Don't** use a single width-only formula with a fixed font floor: long strings
  hit the floor and the floor breaks the width guarantee. The min(width,height)
  cap handles len ∈ {1..80} cleanly.

**Do NOT** measure the text off-screen to compute a unit — that races the web
font load (measures the narrower fallback, oversizes the overlay) and overflowed
on freshly-loaded pages. `adjustsFontSizeToFit` is also web-unsupported, so it is
not a safety net.

**Builder parity:** the pdf-lib builder draws watermark text horizontally from
`wmPlace`, sizing via `helv.widthOfTextAtSize`, so the exported PDF is exact
regardless of the preview's approximation; only the on-screen preview uses the
length-based estimate.
