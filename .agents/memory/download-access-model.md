---
name: Download access model (web + mobile)
description: Who can re-download a converted file, and how guest vs logged-in access is enforced client-side.
---

# Download access behavior

**Rule:** the server is the source of truth — `GET /api/download/:jobId` is optionalAuth and 403s when `job.userId && req.user?.id !== job.userId`; guest jobs (`userId` null) stay open. Do NOT add download tokens or schema changes. Logged-in users can therefore re-download anytime, including after logout + re-login.

**Guests get ONE in-session download per conversion.** Access lives only in component/screen state:
- Web: converted `downloadUrl` lives in React component state (ConversionWorkflow / HeroToolConverter / Tools / PdfMergeWorkflow). Never persist guest download URLs to localStorage.
- Mobile: the convert screen (`app/convert/[toolId].tsx`) holds `output={uri,name}` in state. Persistence to `addHistory`/`addFile` is **gated on `isAuthenticated`** — guests are never written to durable history/files, otherwise their open guest job (durable object storage) would be re-downloadable forever.

**Why:** guest jobs are intentionally open on the server (no token), so the ONLY thing preventing re-download is the client not stashing the jobId/uri anywhere durable.

**Friendly 401/403 message** — everywhere a download can hit a user-owned job the caller must show "Please log in to download this file." (not a raw status):
- Web: `src/lib/download.ts` throws that message on 401/403; callers must surface `err.message` (Dashboard, UsageStatistics, ConversionWorkflow, HeroToolConverter, PdfMergeWorkflow, Tools).
- Mobile: `services/files.ts#downloadRemoteFile` throws a status-bearing `DownloadError` (`.status`); callers (`app/history.tsx`, `app/dashboard/index.tsx`) map 401/403→friendly, 404→"convert again". The convert screen's own `downloadOutput` web path maps 401/403 too.

**Logout cleanup** so stale account screens don't show dead download buttons:
- Web `AuthContext.signout()` hard-navigates to `import.meta.env.BASE_URL` (full teardown).
- Mobile `AuthContext.signout()` calls `clearHistory()`. Do NOT clear the Files store on logout — its entries re-download from a LOCAL `uri` (works offline, not backend-gated), so they aren't "dead", and clearing would also delete scanned docs.
