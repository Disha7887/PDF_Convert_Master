---
name: Tool upload-page header convention
description: Where the tool page header lives and the rule for showing it only on working states, not the upload empty state
---

# Tool upload-page header

All tool pages (PDF converter, PDF edit, image edit) draw their centered
icon + title + description + trust-text header from `ToolPageShell`
(`components/upload/ToolPageShell.tsx`) via its `showHeader` prop (default true).

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
