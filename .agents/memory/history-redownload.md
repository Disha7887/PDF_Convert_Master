---
name: Mobile History re-download
description: How the mobile History screen re-downloads past conversions and what each row shows.
---

# Mobile History re-download (pdf-convert-mobile)

History rows re-download the produced file on tap (they do NOT navigate to the tool upload page).

- `HistoryEntry` carries both `jobId?` (server-converted outputs) and `uri?` (local fallback).
- Download prefers the durable backend copy: `downloadAndSave(`${API_ORIGIN}/api/download/${jobId}?format=<ext>`, fileName)`.
  Falls back to local `saveFile(uri, fileName)` for editor outputs (pdf/image editors have no server job).
- **MUST append `?format=<ext>`** (derived from the saved `fileName`/`outputFormat`) so OCR-text rows
  (saved as .txt/.doc/.html/.md) hit the format-aware download and get rebuilt text, not the PDF bytes.
  Harmless for other exts (server passes them through). Applies to History, Dashboard recent, AND the
  Files tab. The **Files tab** previously re-downloaded the LOCAL `uri` (the OCR PDF) under the patched
  `.txt` name → broken; it now also prefers backend `jobId`+format for converted entries (local uri only
  for scanned/editor outputs with no jobId). See ocr-text-storage.md for the server side.
- Convert flow populates `jobId` + `uri`; the two editors populate only `uri`.
- Rows with neither `jobId` nor `uri` (legacy entries) are rendered non-interactive (dimmed, no download icon, `disabled`) so a tap never errors.

**Why:** local cache URIs (`Paths.cache`) get evicted, so a uri-only re-download is unreliable; the backend `/api/download/:jobId` serves from durable object storage. Architect flagged uri-only as a regression for older/evicted entries.

**How to apply:** when adding any new conversion entry-point, store `jobId` in history if the output came from the server so re-download stays durable.

## Row display (mobile AND web; History + dashboard Recent Activity)
Show the SAVED file name (not the tool name), the timestamp, and a file-type badge.
- Mobile History: `fileName` / `formatTime(timestamp)` / `outputFormat` badge.
- Mobile Dashboard recent: `outputFilename || inputFilename` / `timeAgo` / `tool.outputFormat` badge ("Failed"/danger when status != completed).
- Web (pdf-convert-master) Dashboard `ActivityItem` + `UsageStatistics` rows: same — primary = `outputFilename || inputFilename`, timestamp, badge = `getOutputFormatByServerType(toolType) ?? "File"` (added to `lib/toolConfig.ts` as a reverse lookup over `toolConfigs` via `getServerToolType`). Badge shows "Failed" for failed, raw status while processing. Re-download already worked via `downloadFromUrl(/api/download/:id)`; only the display changed. Web keeps a `" (API)"` suffix on API-sourced jobs (not the tool name).
