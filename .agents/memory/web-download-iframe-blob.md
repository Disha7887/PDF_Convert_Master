---
name: Web download in iframe (blob, not window.open)
description: Why converted-file downloads must fetch→blob→<a download> instead of window.open/anchor navigation in the Replit preview/canvas iframe.
---

# Web converted-file downloads must use fetch→blob→`<a download>`

Triggering a download by `window.open(url, '_blank')` or navigating a bare
`<a href="/api/download/:jobId">` is **blocked** inside the Replit preview /
canvas iframe (popup blocker + iframe sandbox). The server endpoint is fine; the
client just never saves the file.

**Rule:** download converted files via the shared helper
`src/lib/download.ts` `downloadFromUrl(url, fallbackName?)` — it `fetch`es the
URL, reads a `Blob`, creates an object URL, clicks a temporary `<a download>`,
then revokes. Filename comes from `Content-Disposition` (RFC5987 `filename*`
aware) with a fallback. This stays same-document so it works in embedded iframes.

**Why:** `/api/download/:jobId` returns `Content-Disposition: attachment` and
**deletes the file after the first GET**. The blob approach issues exactly one
GET per click, so it is compatible with delete-on-download. A re-click after the
file is purged 404s → helper throws a friendly "file no longer available" error.

**How to apply:**
- All four web download trigger sites use it: `ConversionWorkflow` (single +
  download-all), `PdfMergeWorkflow`, `Tools`, `HeroToolConverter`.
- `downloadAllFiles` serializes the calls (await + small gap) so the browser
  doesn't throttle rapid auto-downloads, and reports `X succeeded, Y failed`.
- Client-side-built files (image/watermark/sign tools, `PdfEditor` export) already
  use blob helpers (`downloadBytes`/`downloadPdf`/`downloadBlob`) — leave them.
- `PdfEditor.printPdf` legitimately uses `window.open` for a print preview (with a
  popup-blocked fallback toast) — that is print, not download; don't "fix" it.
