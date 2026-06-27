---
name: OCR text side-channel & job-store cleanup
description: pdf-convert api-server clears in-memory job stores on download; clients must fetch side-channel data first.
---

# OCR text side-channel & in-memory job cleanup

The api-server keeps converted output in **in-memory Maps keyed by numeric job id**
(`convertedFileStorage`, plus `ocrTextStorage` for OCR recognized text). These are
deleted when `GET /api/download/:jobId` serves the file.

**OCR text is ALSO persisted durably** (since the OCR-redownload bug): on job
completion the pages are written to an object-storage sidecar
(`conversions/<jobId>-ocr-text.json` via `saveOcrText`), in addition to the in-memory
Map. `resolveOcrPages(jobId)` reads memory first, then the S3 sidecar.
`deleteConvertedFile` removes the sidecar too. So OCR text now survives purge-on-
download AND server restart — required because re-downloads happen long after convert.

**Format-aware `/api/download/:jobId?format=txt|doc|html|md`:** rebuilds the OCR text
file server-side from stored pages (server `buildOcrContent` mirrors web/mobile so the
bytes match the first client-built download). Gating: only the 4 text formats enter the
rebuild path; if pages exist it serves text; else if `toolType === 'ocr_pdf'` it 404s
(honest — never serves PDF bytes under a .txt name); any other format / non-OCR job
falls through to the unchanged PDF/file passthrough (so a non-OCR tool that genuinely
outputs `.txt`/`.doc` is NOT intercepted). **Why:** OCR persists only the searchable
PDF as the job's file; re-downloading an OCR result as ".txt" previously passed through
the PDF bytes saved under a text name → a broken file (a PDF renamed .txt).

**Rule:** any side-channel data tied to a job (e.g. OCR text via `GET /api/ocr-text/:jobId`)
must be fetched by the client **before** it triggers the PDF download, because the
download handler purges the in-memory stores (the S3 sidecar is the durable fallback).

**Client download UX:** the OCR result screen lets the user re-download in multiple
formats *after* the PDF was already downloaded once. So for the PDF option it MUST
reuse the locally-held `output.uri` (the file fetched at conversion time) — never
re-call `/api/download`, which would 404 post-cleanup. Text-derived formats (TXT,
HTML, .doc-via-HTML, Markdown) are generated on-device from the already-fetched OCR
pages, so they keep working regardless of server cleanup.

**Why:** the mobile flow already fetches OCR text inside `getConversionResult` (right
after polling completes) and only then calls `downloadOutput`, so cleanup-on-download
is safe. Reordering those steps would 404 the text.

**Access model:** `/api/jobs`, `/api/download`, and `/api/ocr-text` are all
unauthenticated with guessable numeric ids by the app's no-forced-login design. OCR
text exposes the same data class as the already-public searchable PDF, so it stays at
parity — don't bolt auth onto just one of them.
