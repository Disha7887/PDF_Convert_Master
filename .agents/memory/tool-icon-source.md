---
name: Tool-specific icon source (mobile)
description: Where the canonical per-tool icon lives in pdf-convert-mobile and how to render it elsewhere (e.g. file lists).
---

# Per-tool icon = ToolLottieIcon keyed by toolId

The canonical tool icon shown on the home screen and tools list is
`components/ToolLottieIcon.tsx`, rendered as `<ToolLottieIcon toolId={tool.id} />`.
It resolves identity via `getToolById` + `TOOL_ANIMATIONS` and falls back to that
tool's `feather` glyph (from `constants/tools.ts`) for tools without a Lottie. This
covers all tools with one component — never hardcode per-screen icon maps.

**Why:** any surface that needs to show "the tool that produced X" (e.g. the
Converted Files list in `app/(tabs)/files.tsx`) must reuse `ToolLottieIcon` with the
stored `entry.toolId`, not a coarse `kind`→Feather map. `StoredFileEntry` persists
`toolId` (set in `app/convert/[toolId].tsx`), so the lookup is always available for
converted files; keep any `kind`-based map only as a last-resort fallback for legacy
entries lacking `toolId`. Scanned entries keep their real photo `thumbnailUri`.

**How to apply:** in non-virtualized lists, pass `autoPlay={false} loop={false}` so
each row shows the static icon identity without animating many Lotties at once
(perf/battery). Use animated defaults only for single, prominent icons.
