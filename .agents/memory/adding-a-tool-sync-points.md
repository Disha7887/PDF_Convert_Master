---
name: Adding a conversion tool — sync points
description: The non-obvious registries/maps that must ALL be updated to add a new PDF Genius conversion tool end-to-end
---

Adding a new server-backed conversion tool (e.g. compress_video / "MP4 Compressor")
requires updating several loosely-coupled lists. Missing any one fails silently or
with a generic error.

**Backend (api-server):**
- `lib/db` ToolType enum — add the value (restart api-server after; see shared-enum-restart.md).
- `storage.ts` has TWO `tools: ToolConfig[]` registries (both MemStorage-style classes). `/api/convert` validates via `getToolByType`, so the tool MUST be added to BOTH arrays or you get `{"error":"Tool not found"}`. The backend `ToolCategory` enum has no video category — reuse an existing one (only backend grouping, not frontend display).
- `MIME_TYPES` map — add the input extension→mime.
- `performActualConversion` switch — add the `case`.

**Web (pdf-convert-master):**
- `toolConfig.ts` entry, `toolActionLabels.ts`, an upload page + lazy Route in `App.tsx`, and `Tools.tsx` `mainToolKeys` (+ any new filter button).
- **`Tools.tsx` `toolTypeMap`** (dash-id → underscore serverToolType). Easy to miss — the `/tools` card modal submit reads `toolTypeMap[id]`; if absent it sends `undefined` and the convert fails, EVEN when the dedicated `/upload/<id>` page works. Test BOTH web entry points.
- Icons fall back gracefully: no TOOL_ANIMATIONS entry → ToolLottieIcon renders the lucide `config.icon` in coral. Fine to leave without a Lottie.

**Mobile (pdf-convert-mobile):**
- `constants/tools.ts` Tool entry (+ category in TOOL_CATEGORIES) and `constants/toolActionLabels.ts`. Non-image tools use the generic DocumentPicker convert flow; no per-tool pick code.

**Why:** the tool-type identity is duplicated across enum + 2 storage arrays + web toolTypeMap + web toolConfig + mobile tools.ts. They are not derived from one source, so each is a separate failure point.
