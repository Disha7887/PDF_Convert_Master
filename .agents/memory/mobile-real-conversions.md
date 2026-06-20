---
name: Mobile real conversions (Expo → api-server)
description: How the pdf-convert-mobile CONVERT tools talk to the real backend, and the non-obvious gotchas (web FormData blob, always-real gating, EXPO_PUBLIC_DOMAIN inlining).
---

# Mobile real conversions

The Expo app's CONVERT tools call the same api-server backend the web app uses
(`/api/convert`, `/api/merge-pdfs`, poll `/api/jobs/:id`, download `/api/download/:id`).

## Web FormData needs a real Blob, not the RN file cast
On native, React Native's `fetch`/FormData accepts a `{ uri, name, type }` object
appended as a file (typed via an `as unknown as Blob` cast). **That cast silently
fails to upload on Expo web** — the browser's `FormData` sends `[object Object]`,
not the file. On web you must `await fetch(localUri).then(r => r.blob())` and
`form.append(field, blob, name)`.
**Why:** RN's FormData polyfill understands the uri-object shape; the DOM one does not.
**How to apply:** any file upload from this app must branch on `Platform.OS === "web"`.

## CONVERT is always-real, independent of USE_MOCK_DATA
`USE_MOCK_DATA` governs auth/dashboard/marketing only. Conversions are gated by a
separate `USE_REAL_CONVERSIONS` flag; effective check is
`USE_REAL_CONVERSIONS || !USE_MOCK_DATA`.
**Why:** the product requires anyone to run real conversions without being forced to
log in, while the rest of the app stays on the offline mock layer.
**How to apply:** don't fold conversions back under `USE_MOCK_DATA`; keep the two switches separate.

## EXPO_PUBLIC_DOMAIN is inlined at bundle time
`constants/api.ts` builds the backend origin from `process.env.EXPO_PUBLIC_DOMAIN`
(set to the shared dev domain = `REPLIT_DEV_DOMAIN`). Expo inlines `EXPO_PUBLIC_*`
at bundle time, so after changing it you must **restart the expo workflow** (a hot
reload won't pick it up). Download URLs from the server are origin-relative
(`/api/download/:id`) and are resolved against that same origin.

## Server contract shape
Both POST endpoints return `{ success, data: { jobId, ... } }`; job polling returns
`{ success, data: { status, outputFilename, downloadUrl, errorMessage } }`. Client
maps `errorMessage` → `error`. Merge routes when `tool.isMerge` (field `files`);
single-file conversions use field `file` + `toolType` (singular snake_case, e.g.
`compress_image`) + `options` JSON (`outputFormat`, `quality`).
