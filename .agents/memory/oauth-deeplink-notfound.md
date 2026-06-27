---
name: OAuth deep-link +not-found collision (Expo Android)
description: Why Google sign-in showed expo-router "screen doesn't exist" after success, and the catch-route fix.
---

# Google OAuth deep-link lands on expo-router +not-found (Android)

Native Google sign-in uses `WebBrowser.openAuthSessionAsync(startUrl, Linking.createURL("auth"))`,
so the backend redirects to `pdfgenius://auth?token=...`. On **Android**, `openAuthSessionAsync`
captures the token (login DOES succeed), but the OS **also** delivers that deep link to expo-router,
which navigates to `/auth`. The `app/auth/` group had `sign-in`/`sign-up`/`forgot`/`reset` but **no
`index.tsx`**, so `/auth` resolved to `+not-found` ("Oops! This screen doesn't exist."), preempting
AuthSheet's welcome-back Lottie.

**Fix:** add `app/auth/index.tsx` as a catch route + register it in `_layout.tsx` Stack. It shows the
welcome Lottie while the async token-fetch/persist settles, then `<Redirect>` to dashboard once
`isAuthenticated`, or to sign-in on an `error` query param or after an 8s timeout.

**Why not change the redirect path:** ANY deep-link path is routed through expo-router; an unmatched
path always hits `+not-found`. The robust fix is to make the redirect path resolve to a real screen,
not to pick a "non-route" path.

**Race note:** `persist` (and the `/auth/user` fetch) are async, so `isAuthenticated` may briefly be
false when `auth/index` mounts. The context `loading` flag only tracks initial bootstrap, NOT the
OAuth callback, so gating on it does nothing here. Worst case the timeout sends them to sign-in, where
AuthSheet's own authenticated-redirect effect still forwards them to dashboard. Kept timeout generous.

**Build:** JS-only, so it works in Expo Go but Play testers need a fresh EAS build to verify.
