---
name: SvgXml viewBox clipping
description: Why raw SVGs rendered via react-native-svg SvgXml must have a viewBox before resizing.
---

When rendering raw SVG XML through `react-native-svg`'s `SvgXml` and overriding
size with `width`/`height` props, the SVG **must contain a `viewBox`**. If the
source SVG only declares `width`/`height` attributes (no `viewBox`), passing a
smaller width/height does NOT scale the artwork — it clips to the top-left
corner of the original coordinate space (e.g. a 100×100 icon shows only a 28×28
sliver).

**Why:** without a viewBox there is no coordinate-system-to-viewport mapping, so
the renderer treats width/height as a crop window, not a scale factor.

**How to apply:** when ingesting third-party SVGs for `SvgXml`, normalize them
first — if `viewBox` is absent, inject `viewBox="0 0 {width} {height}"` derived
from the root width/height attributes. In pdf-convert-mobile this is done in the
generator that produces `constants/formatIcons.ts` (the file-format icon map).
