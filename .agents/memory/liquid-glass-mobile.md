---
name: Liquid Glass material (mobile)
description: How the pdf-convert-mobile app gets its Apple "Liquid Glass" glossy look cross-platform, and the constraints to keep it readable.
---

# Liquid Glass surfaces are a custom primitive, not expo-glass-effect

The glossy "Apple Liquid Glass" look across pdf-convert-mobile is a custom
`components/Glass.tsx` `GlassSurface` (BlurView + translucent fill + diagonal
specular sheen via LinearGradient + bright hairline border). It is used by the
shared `Card`, `ToolCard`, the TopNav account menu, and anywhere a glassy panel
is wanted.

**Why custom, not `expo-glass-effect`:** the native `expo-glass-effect` GlassView
only renders real glass on iOS 26+, and `isLiquidGlassAvailable()` is false in
Expo Go — where the user tests. The custom primitive works on Android/web/Expo Go
too, so the look is consistent everywhere. The native `NativeTabs` path is still
used when liquid glass IS available (see `(tabs)/_layout.tsx`); the classic tab
bar got a blur+sheen overlay for everyone else.

**How to apply / constraints:**
- BlurView only refracts what's BEHIND it. Glass on a flat white screen looks
  dead, so `ScreenScroll` paints an ambient backdrop (faint coral gradient +
  two diffuse coral glows) behind every screen — keep that, it's what sells depth.
- Android needs `experimentalBlurMethod="dimezisBlurView"` on BlurView or it won't blur.
- Keep text dark over the light translucent fill for contrast; coral `#f7433d`
  stays the accent (the ambient uses `blue50`/`blue*` tokens which resolve to
  coral-family values, NOT blue — branding rule still holds).
- Filled `Button` variants get a clipped top sheen (`overflow:"hidden"` +
  LinearGradient); glass containers clip via an inner `overflow:"hidden"` layer.
- Glass is overdraw-heavy: if dense lists stutter, lower `intensity` or pass
  `sheen={false}`/`flat` rather than removing the material.
