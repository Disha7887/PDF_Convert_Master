---
name: Conversion output persistence
description: How converted output files survive beyond first download / server restart in pdf-convert.
---

Converted output bytes are persisted to Replit object storage so users can re-download a past
conversion anytime — not just immediately after converting.

**Why:** Outputs originally lived ONLY in in-memory Maps (`fileStorage` / `convertedFileStorage`)
and were deleted on first `/api/download`, so history rows could never be re-downloaded and a
server restart lost everything.

**How to apply:**
- api-server stores each completed job's output via a deterministic key `conversions/<jobId>` under
  the private object dir (content-type kept in GCS object metadata, not a DB column — no schema change).
- `/api/download/:jobId` resolves memory-first, then falls back to object storage; it still purges the
  in-memory copy after serving but KEEPS the durable object-storage copy. Don't reintroduce a delete of
  the durable copy on download.
- Persisting in `processFile` is best-effort (try/catch, non-fatal) — a storage failure must not fail
  the conversion job.
- Client re-download names come from the job's `outputFilename` (now included in `/api/usage` recent).
- Native re-download (`downloadRemoteFile`) MUST check the HTTP status from `LegacyFS.downloadAsync`
  and delete + throw on non-2xx, or an error JSON body gets saved as if it were the file.
- Re-download UI exists on BOTH platforms: mobile dashboard Recent Activity and web Dashboard
  Recent Activity + Usage Statistics history, all gated on `status === "completed"` and hitting
  `/api/download/:jobId` (web via the iframe-safe `downloadFromUrl` blob helper).

**Download access control (IDOR closed):** `/api/download/:jobId` uses `optionalAuth` + an ownership
gate — `if (job.userId && req.user?.id !== job.userId) return 403`. Owned jobs serve only to their
owner; guest jobs (`conversionJobs.userId` is NULLABLE) stay open so anonymous post-conversion
downloads keep working. jobIds are sequential serial ints, so this gate is what prevents enumeration.

**Why client downloads still work:** rather than editing every call site, the download *primitives*
auto-attach the signed-in user's Bearer token — web `downloadFromUrl` (src/lib/download.ts) and mobile
`downloadRemoteFile` (services/files.ts) + `downloadOutput` (convert/[toolId].tsx). UpscaleImage uses
`authedFetch` directly. **Always route new downloads through these primitives**, or a logged-in user
401/403s on their own file.

**Token-leak guard:** only attach the token to OUR origin — web compares `new URL(url, location.origin)
.origin` (never prefix `startsWith`, which a look-alike origin bypasses); mobile gates on
`url === API_ORIGIN || url.startsWith(API_ORIGIN + "/")` (the trailing slash is the boundary).
