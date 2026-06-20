---
name: OCR text side-channel & job-store cleanup
description: pdf-convert api-server clears in-memory job stores on download; clients must fetch side-channel data first.
---

# OCR text side-channel & in-memory job cleanup

The api-server keeps converted output in **in-memory Maps keyed by numeric job id**
(`convertedFileStorage`, plus `ocrTextStorage` for OCR recognized text). These are
deleted when `GET /api/download/:jobId` serves the file.

**Rule:** any side-channel data tied to a job (e.g. OCR text via `GET /api/ocr-text/:jobId`)
must be fetched by the client **before** it triggers the PDF download, because the
download handler purges all of that job's stores.

**Why:** the mobile flow already fetches OCR text inside `getConversionResult` (right
after polling completes) and only then calls `downloadOutput`, so cleanup-on-download
is safe. Reordering those steps would 404 the text.

**Access model:** `/api/jobs`, `/api/download`, and `/api/ocr-text` are all
unauthenticated with guessable numeric ids by the app's no-forced-login design. OCR
text exposes the same data class as the already-public searchable PDF, so it stays at
parity — don't bolt auth onto just one of them.
