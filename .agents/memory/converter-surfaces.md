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
- `client/src/components/pdf-tools/PdfToolShell.tsx` (`PdfDropzone`) — empty-state upload for every PDF Editor tool page (`/upload/{crop,sign,watermark,add-image,delete-pages,ocr}-pdf`) AND the main `PdfEditor.tsx` (`/upload/edit-pdf`). `PdfEditor` is an easy-to-miss caller — it's a separate render path, not a `/upload/<id>` page wrapper.

**Dead / unrouted (skip):** `client/src/components/FileUploadModal.tsx` and
`client/src/components/ui/bouncing-upload-icon.tsx` (after the Lottie migration).

**Per-tool upload icon = each tool's OWN Lottie (by id), NOT a lucide badge.**
`ConverterStatusIcon` (in `converter-status-icon.tsx`) takes a single optional
`toolId: string`; in the "upload" state it plays `TOOL_ANIMATIONS[toolId]`
(imported from `tool-lottie-icon.tsx`), falling back to the generic syncing-file
Lottie when the id is missing/unmapped. The "processing" state plays
`assets/lottie/processing.json`; success/error = correct-file/discarded-file.
EVERY upload surface passes `toolId` (e.g. `toolConfig.id` / `tool.id` / `cfg.id`,
or hardcoded `"resize-images"` etc.) — there are no more `ToolIconBadge` or
`toolIcon*`/color/bg/border props (those were removed; the old lucide-badge
approach was reverted). Gotchas: (1) `/upload/compress-image` passes the SINGULAR
`toolType`, so `TOOL_ANIMATIONS` needs both `"compress-images"` and an alias
`"compress-image"`; (2) PDF-Editor tool ids (`crop-pdf`,`sign-pdf`,`edit-pdf`,…)
are NOT in `TOOL_ANIMATIONS` → they intentionally fall back to syncing-file;
(3) `EnhancedUploadArea` still swaps to a lucide CloudUpload/Sparkles affordance
during DRAG-OVER only (intentional drop cue), and that is pre-existing, not the
resting per-tool icon. **Why:** review failed for missing `UploadPage.tsx`
(`/upload-demo`) + `UploadModal.tsx` (`/dashboard/live-tools`) — both receive a
toolConfig but were left without `toolId`; check ALL surfaces below.

**Why:** a single "make it global" request fanned out across 9 live surfaces; the
first pass only hit 2 and failed review. There is no central converter shell.

**How to apply:** shared status icon lives in `client/src/components/converter-status-icon.tsx`
(`ConverterStatusIcon`). Keep tiny inline indicators (w-4 step badges, per-file
`FileItem` chips, in-button spinners) as lucide — Lottie at ~16px looks wrong.
