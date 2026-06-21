---
name: Web tool icons always animate
description: ToolLottieIcon on web intentionally ignores OS "reduce motion" for mobile parity
---

Web `ToolLottieIcon` (pdf-convert-master) always plays its Lottie; it only falls back to the static lucide icon when no animation is registered for the tool id. It does NOT honor the OS/browser "reduce motion" setting.

**Why:** Explicit user request for full parity with the mobile app, which always animates and ignores reduce-motion. Previously the web used framer-motion `useReducedMotion()` and fell back to static icons when reduce-motion was on — that made web look "broken/static" vs mobile.

**How to apply:** Do not re-introduce `useReducedMotion` into `ToolLottieIcon` as an "accessibility fix." If an accessibility escape hatch is ever wanted, add a separate in-app toggle rather than reading the OS setting. `LottieIcon` (the shared base used by `ConverterStatusIcon` for processing/success/error) already always autoplays — no reduce-motion gate there either.
