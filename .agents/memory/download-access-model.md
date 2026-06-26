---
name: Download access model (web + mobile)
description: Who can re-download a converted file, and how guest vs logged-in access is enforced client-side.
---

# Download access behavior

**Server is the source of truth.** `GET /api/download/:jobId`, `GET /api/jobs/:jobId`, and `GET /api/ocr-text/:jobId` are ALL optionalAuth and 403 when `job.userId && req.user?.id !== job.userId`; guest jobs (`userId` null) stay open. Do NOT add download tokens or schema changes. Logged-in users can re-download anytime (incl. after logout + re-login).

**CRITICAL — owned jobs require the token on EVERY read, including polling.** Because `/api/jobs/:jobId` and `/api/ocr-text/:jobId` now enforce ownership, any client that polls/reads a job MUST send the JWT, or a logged-in user's own job 403s and the conversion appears to fail/time out. Authed callers:
- Web: `authedFetch` (attaches `Bearer auth_token`) — used by `HeroToolConverter.pollJob` and `ConversionWorkflow.pollJobStatus`. Plain `fetch` for polling is a regression.
- Mobile: `headers: authHeaders()` on the GET in `services/api.ts` `realPollJob` AND `realFetchOcrText`.
**Why:** adding the ownership check server-side without updating these poll calls silently breaks all logged-in conversions. The architect caught exactly this.

**Guests now PERSIST their last conversion (NOT one-shot anymore).** Guest jobs stay open on the server, so the client deliberately stashes them to enable re-download:
- **Web — re-download after refresh.** `src/lib/guestDownloads.ts` persists `{toolType,jobId,fileName,ts}` to localStorage (only when `isGuest()` = no auth token). `GuestRecentDownloads.tsx` renders a per-tool card on the idle/upload stage (hero homepage + ConversionWorkflow). Persist on guest job completion using `job.outputFilename`. Logged-in users are NOT persisted here (their durable history covers them).
- **Mobile — 12h guest window then login wall.** `app/convert/[toolId].tsx` persists EVERY conversion (guests too; the old `isAuthenticated` guard was removed). `services/downloadGate.ts` (`GUEST_DOWNLOAD_WINDOW_MS` = 12h, `isGuestDownloadExpired(ts)`) decides at download time. Gate is purely client-side + based on CURRENT `isAuthenticated` + entry age (history.timestamp / files.createdAt) — there is NO per-entry guest flag. `history.tsx` gates ALL entries; `(tabs)/files.tsx` gates converted entries only (scanned images are exempt). When expired & not authed, show `LoginRequiredModal` (RN Modal + `AuthResultIcon` kind `"login-required"` → `assets/lottie/please-login.json`) which routes to sign-in. Logged-in mobile downloads anytime.

**Friendly 401/403 message** — everywhere a download/read can hit a user-owned job, surface "Please log in to download this file." (not a raw status):
- Web: `src/lib/download.ts` throws that message on 401/403; callers surface `err.message`.
- Mobile: `services/files.ts#downloadRemoteFile` throws a status-bearing `DownloadError`; callers map 401/403→friendly, 404→"convert again".

**Logout cleanup:**
- Web `AuthContext.signout()` hard-navigates to `import.meta.env.BASE_URL` (full teardown).
- Mobile `AuthContext.signout()` calls `clearHistory()`. Do NOT clear the Files store on logout — entries re-download from a LOCAL `uri` (offline, not backend-gated) and clearing would also delete scanned docs.
