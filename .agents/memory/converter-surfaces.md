---
name: Converter upload/status surfaces
description: The full set of components that render a converter's upload/processing/success/error UI — needed for any "global" converter change.
---

# Converter surfaces (for app-wide / "global" changes)

Any request to change a converter's upload prompt, status icon, or stage styling
"everywhere" must touch ALL of these — they do NOT share one upload component:

- `client/src/components/HeroToolConverter.tsx` — homepage in-place PDF converter (idle/converting/done/error).
- `client/src/pages/sections/HeroSection.tsx` — the default (no `?tool=`) hero upload card.
- `client/src/pages/Tools.tsx` (`ToolCard`) — `/tools` cards: upload dialog + converting/done/error stages.
- `client/src/components/ConversionWorkflow.tsx` — powers most `/upload/*` pages (converting/completed/error big icons); its upload stage delegates to `ui/enhanced-upload-area.tsx`.
- `client/src/components/ui/enhanced-upload-area.tsx` — the dropzone used by ConversionWorkflow.
- `client/src/components/image-tools/ImageDropzone.tsx` — shared upload surface for the image-tool pages (Resize/Crop/Rotate/Upscale + `ImageEditTools.tsx`).
- `client/src/pages/upload/UpscaleImage.tsx` — standalone page with its own processing/error visuals.
- `client/src/components/UploadModal.tsx` — used by `LiveTools` (`/dashboard/live-tools`).
- `client/src/components/UploadPage.tsx` — used by `UploadDemo`.

**Dead / unrouted (skip):** `client/src/components/FileUploadModal.tsx` and
`client/src/components/ui/bouncing-upload-icon.tsx` (after the Lottie migration).

**Why:** a single "make it global" request fanned out across 9 live surfaces; the
first pass only hit 2 and failed review. There is no central converter shell.

**How to apply:** shared status icon lives in `client/src/components/converter-status-icon.tsx`
(`ConverterStatusIcon`). Keep tiny inline indicators (w-4 step badges, per-file
`FileItem` chips, in-button spinners) as lucide — Lottie at ~16px looks wrong.
