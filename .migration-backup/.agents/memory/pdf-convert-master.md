---
name: PDF Convert Master quirks
description: Non-obvious auth contract, build behavior, and public-API upload safety for this repo.
---

# Auth contract
- Sign-in/sign-up endpoints are `POST /api/signin` and `POST /api/signup` (NOT `/api/auth/*`). Signup does NOT auto-login.
- The JWT is returned at `response.data.token` (nested), not at the top level. Frontend stores it in `localStorage` under key `auth_token`; send it as `Authorization: Bearer <token>`.
- The user record has only `email` and `plan` (no `name` field). Anything wanting a display name derives it from the email (e.g. `email.split('@')[0]`).
- The default react-query fetcher uses cookies only, so JWT-protected endpoints must go through the dedicated authed fetch helper, not the default fetcher.

# Build gate
- `npm run build` = vite + esbuild only, with NO TypeScript typecheck step. TS-only errors (bad casts, etc.) will NOT fail the build. Don't rely on the build to catch type mistakes; reason about types manually.

# Public REST API (`POST /api/v1/:toolType`) upload safety
**Rule:** Multer's `limits.fileSize` is PER FILE, not per request. With `.any()` + a `files` count limit, a caller can still buffer `files × fileSize` bytes into memory before any route-level size/count check runs.
**Why:** A naive global `multer({ fileSize: 210MB, files: 20 })` let an authenticated caller force ~4.2GB of in-memory buffering → process OOM/DoS.
**How to apply:** Resolve the tool from `:toolType` in a middleware BEFORE parsing, then build a per-request multer whose `files` is `1` for normal tools (only `merge_pdfs` needs up to 20) and whose `fileSize` is that tool's own `maxFileSize`. Stash the resolved tool/toolType on `req` so the handler doesn't re-look-it-up. Also: never log user email or raw/partial API keys in the auth middleware — log only the internal key id.
