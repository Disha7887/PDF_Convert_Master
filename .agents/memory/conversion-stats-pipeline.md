---
name: Conversion stats pipeline
description: How /api/usage dashboard numbers are produced, and why they can read 0 even when conversions work.
---

`/api/usage` computes a user's dashboard totals on the fly from their `conversion_jobs`
rows (no separate counters table). Key non-obvious facts:

- **dataProcessed = sum of `output_file_size`.** That column is only meaningful when
  populated at job *completion*. It is NOT set at job creation. It must be passed
  through `storage.updateConversionJobStatus(..., outputFileSize)` from the completion
  call sites (`/api/convert`, `/api/merge-pdfs`). If a completion path forgets to pass
  it, "Data Processed" silently reads 0 even though conversions succeed.
  **Why:** the per-job byte size is the only source for that stat.

- **Conversions are async.** `/api/convert` returns `status:"pending"` immediately and
  finishes in the background (html_to_pdf ~12s). Do not assert `/api/usage` right after
  POSTing — poll or wait, or query `conversion_jobs` directly.

- **Conversions are anonymous by default.** The free public tool creates jobs with
  `user_id = NULL` unless a bearer token is attached. The vast majority of historical
  jobs are anonymous and never appear on any dashboard — that is expected, not a bug.
  Only token-attached (logged-in) conversions attribute to a user.
  - Web attaches the token via `authedFetch`; mobile via `getAuthToken()` header
    (`services/authToken.ts` set from `AuthContext`).
  - **Mobile caveat:** the token plumbing ships in the JS bundle, so a user on an older
    EAS APK won't attribute until they install a fresh build.

- **storage layer is real Postgres.** `storage = new DatabaseStorage()` (Drizzle via
  `DATABASE_URL`). Persistence already works; the in-memory `MemStorage` is unused by
  the live app. An older memory note claiming "MemStorage in-memory" was outdated.
