---
name: Conversion delete purges durable copy
description: How deleting a converted file removes the Backblaze/S3 copy across web + mobile, and the authoritative-delete rule.
---

# Deleting a converted file (purge durable copy)

`DELETE /api/download/:jobId` (api-server routes) is the single endpoint that
removes a conversion everywhere: durable object-store copy (`deleteConvertedFile`
→ S3 key `conversions/<jobId>`), the in-memory maps, and the DB job row
(`storage.deleteConversionJob`). Auth = `optionalAuth`, ownership mirrors GET
download (user-owned jobs need matching JWT, guest jobs open by id). Missing job
→ idempotent 200; invalid id → 400.

**Rule — durable delete is authoritative.** Delete the S3 object FIRST and let a
genuine failure throw (→ 500); do NOT swallow it and still drop the job row, or
the object is orphaned forever (the exact "Backblaze keeps files forever" bug).
`deleteObject` already no-ops on NoSuchKey/NotFound/404, so an already-gone copy
still succeeds — idempotency is preserved without try/catch around it.

**Clients.** Web Dashboard "Recent Activity" delete uses `authedJson` DELETE then
invalidates `["/api/usage"]`, and surfaces failures via toast (does not optimistically
remove). Mobile History + Files each call `services/conversions.ts#deleteConversion(jobId)`
best-effort (local entry removed first, backend purge ignored on failure — matches
the app's offline-first convention).

**Why mobile carries jobId in two places.** A conversion creates BOTH a History
entry (`HistoryEntry.jobId`) and a Files entry; `StoredFileEntry.jobId` was added so
the Files tab can also purge the backend copy. Caveat: the two local stores are
independent but point at the SAME backend job — deleting from one purges the shared
durable copy, so the other tab's stale entry will fail to re-download. Accepted
tradeoff (user wants the file truly gone).

Mobile rename consistency was already correct: `convert/[toolId].tsx#onConfirmDownload`
patches both stores (`updateHistory`/`updateFile`) to the user's chosen name; the
backend may store a different name and that's fine (frontend shows the user name only).
