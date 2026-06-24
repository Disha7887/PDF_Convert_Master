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

**Known open caveat — IDOR on `/api/download/:jobId`:** the endpoint has NO auth/ownership check and
jobIds are sequential serial integers, so anyone can enumerate and download another user's "private"
output. Closing it safely is broad: it requires threading the auth token through every download call
site (4 web immediate-download flows + the mobile convert flow + both Recent Activity surfaces) and
enforcing `job.userId === requester.id` only for owned jobs (guest jobs with null userId must stay
open for immediate post-conversion download). Don't add strict auth to this endpoint without updating
all those call sites, or you break working immediate downloads.
