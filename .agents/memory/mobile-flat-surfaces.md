---
name: Mobile flat surfaces (no glossy)
description: pdf-convert-mobile buttons/cards are flat solid color, not glossy/liquid-glass
---

The pdf-convert-mobile app uses **flat, static-coloured** buttons and cards — no glossy sheen, no frosted "liquid glass".

**Why:** User explicitly asked to drop the glossy/shiny gradient look in favour of solid static color. This SUPERSEDES the earlier custom "Apple Liquid Glass" `GlassSurface` (BlurView + specular LinearGradient sheen + hairline border) — do not bring that look back.

**How to apply:**
- `components/Glass.tsx` `GlassSurface` is now a **solid** surface (solid white / coral-tinted fill, `C.border`, soft shadow) — it keeps the `GlassSurface` name and its `intensity`/`sheen` props for call-site compatibility, but those props are no-ops. Do not reintroduce `BlurView` + specular `LinearGradient` sheen here.
- `components/ui.tsx` `Button` has **no** white sheen overlay — filled variants are solid (`primary` = coral `#f7433d`).
- The `LinearGradient` ambient backdrop in `ScreenScroll`/`ScreenAmbient` and the `BlurView` nav bar in `TopNav` are separate from buttons/cards and were intentionally left intact.
