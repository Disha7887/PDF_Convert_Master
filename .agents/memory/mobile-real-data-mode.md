---
name: Mobile real-data mode (logged-in)
description: How the pdf-convert-mobile logged-in experience uses real backend data, and what must stay wired together.
---

# Logged-in mobile uses REAL backend data

`USE_MOCK_DATA = false` (in `constants/config.ts`) is the switch that makes auth + dashboard + usage hit the real api-server. The switch is kept (per user preference) — it is just set to real. Conversions were already always-real via `USE_REAL_CONVERSIONS`.

**Why:** user requirement — when logged in, profile/statistics/usage/recent-activity must be real, no dummy/placeholder.

## The wiring that must stay consistent
- **Token holder**: `services/api.ts` is a plain module (not a hook), so it can't read `AuthContext`. A module-level holder `services/authToken.ts` (`setAuthToken`/`getAuthToken`) bridges them. `AuthContext` MUST call `setAuthToken` on login (persist), restore (mount), and signout — or conversions won't attribute to the user.
- **Conversion attribution**: real `/convert` and `/merge-pdfs` requests attach `Authorization: Bearer <token>` (backend `optionalConversionAuth` records the job with the userId). Without the token the job is anonymous and never shows in `/api/usage`.
- **Single usage source**: `services/account.ts#fetchUsage(token)` normalizes `GET /api/usage` → `{totals, mostUsed, byDay, recent}`. Both `app/dashboard/index.tsx` and `app/dashboard/usage.tsx` consume it so their numbers agree. `mostUsed[].type` is the **serverToolType** — map to a mobile tool via `getToolByServerType` (NOT `getToolById`).
- **Freshness**: after a successful conversion, `app/convert/[toolId].tsx` invalidates query keys `["account-usage"]` and `["usage-stats-real"]` so the dashboard updates without a remount.

## Gotchas
- Real backend has NO seeded demo user, so the AuthSheet demo-credentials hint is gated on `USE_MOCK_DATA`. Users must register their own account.
- Backend storage is in-memory (`MemStorage`) — users and stats reset when api-server restarts. Acceptable "real" behavior, but a fresh restart = empty dashboard until the user converts again.
