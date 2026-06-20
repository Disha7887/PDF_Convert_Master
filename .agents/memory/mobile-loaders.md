---
name: Mobile loaders
description: How loading/processing indicators are standardized in the pdf-convert-mobile artifact.
---

All loading, processing, uploading, and downloading states in the
`pdf-convert-mobile` Expo app render the shared `Loader` (inline) or
`ScreenLoader` (full-screen) from `components/Loader.tsx` (native, lottie-react-native)
and `components/Loader.web.tsx` (web, lottie-react). Both render the
`assets/lottie/processing.json` navy dot-ring animation.

**Why:** User requested one consistent loading icon everywhere — app boot, buttons,
scanner, history, dashboard, file upload/download, and conversion processing.

**How to apply:** For any new loading state, import `Loader`/`ScreenLoader` rather
than `ActivityIndicator`. There should be no `ActivityIndicator` usage left in the
artifact. The convert success/error icons are separate (`success-tick.json` /
`fail-cross.json`) via `components/lottie/converterStatus.ts`.
