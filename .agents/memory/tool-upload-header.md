---
name: Tool upload-page design convention
description: Every tool's upload empty-state is one identical bare dropzone (no header, no card, no progress tab) with an action button that names the tool
---

# Tool upload-page design (one shared look)

All tool upload empty-states (PDF converter, PDF edit, image edit) must look
IDENTICAL: a single shared dashed `UploadDropzone` sitting directly on the
animated background — NO header, NO white card wrapper, NO progress tab. The
reference is the "Sign PDF" tool. The action button must NAME the tool/conversion
(e.g. "Convert to Word", "Sign PDF", "Image Compressor"), never a generic
"Select Files".

**Three things make a tool's upload page diverge — keep them in check:**
1. Header — `ToolPageShell.showHeader`.
2. White card wrapper — `ImageToolShell` wraps children in a `bg-white` card on
   WORKING states only; it must render bare `children` on the upload state
   (`hideHeader`). `ConversionWorkflow` AND `PdfMergeWorkflow` render the card +
   progress tab only on `stage !== 'upload'`; the `upload` stage renders a bare
   `EnhancedUploadArea`. `PdfToolLayout` has no card (already bare).
   NOTE: `PdfMergeWorkflow` is a SEPARATE component (not ConversionWorkflow) and
   must use `ToolPageShell` too — it previously had its own header + wrapper and
   no animated background. After gating the card on `stage !== 'upload'`, delete
   any dead `stage === 'upload'` branch in the progress indicator or tsc errors.
3. Action label — driven by `getToolActionLabel(cfg)` (toolConfig.ts).
   `ConversionWorkflow` falls back to its `toolTitle` prop when `toolType` has
   no `toolConfigs` entry (e.g. page uses `compress-image` but config id is
   `compress-images`) so the button still names the tool.

**Rule:** the upload/empty state of every tool is HEADER-LESS — just the
shared dashed `UploadDropzone`. The header only appears once the user has a
file/selection (working state).

**Why:** user explicitly asked to remove the header from upload pages so all
three tool categories share one clean upload design.

**How to apply:**
- `PdfToolLayout` / `ImageToolShell` expose `hideHeader` → `showHeader={!hideHeader}`.
- PDF edit pages pass `hideHeader={pages.length===0}` (OcrPdf uses `!file`).
- Custom image pages pass `hideHeader={!file}`.
- `ConversionWorkflow` passes `showHeader={stage !== "upload"}`.
- `edit-pdf` (`PdfEditor`) renders its dropzone outside the shell, already headerless.
- All three categories funnel through the same `UploadDropzone`; `PdfDropzone`
  and `ImageDropzone` are config-driven (title=`cfg.dropAreaText`, action label=
  `getToolActionLabel(cfg)`) so copy stays consistent. Don't re-add a header to
  an upload empty state.
