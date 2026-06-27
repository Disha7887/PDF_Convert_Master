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

**A redirect-only catch route is NOT enough.** On many Android devices the deep link is consumed by
expo-router (navigates to /auth) *before* `openAuthSessionAsync` can read it, so `googleSignin` never
captures/persists the token — the catch screen just spins on the welcome Lottie, times out to sign-in,
and the session never saves ("stuck on welcome / must log in again"). The router-captured deep link
carries `?token=...` in `useLocalSearchParams`, so **`auth/index` must capture that token itself** and
complete the login. Added `completeGoogleLogin(token)` to AuthContext (fetch `/auth/user` → `persist`);
`googleSignin` reuses it; `auth/index` calls it once (guarded by a ref), then `<Redirect>` to dashboard.
Double-handling (both paths firing on non-leaking devices) is idempotent — same token, same session.
Bound the `/auth/user` fetch with an AbortController timeout so a hung request can't spin forever; the
8s welcome→sign-in timeout now applies ONLY when no token/error param is present.

**Capturing the token still isn't enough — navigation must be single-authority.** After capture worked,
login succeeded but the app bounced BACK to sign-in. Two causes: (1) `<Redirect>` to `dashboardHome`,
but `dashboard/index.tsx` renders its OWN sign-in gate while `!isAuthenticated`, so the brief auth-state
propagation race showed that gate; (2) AuthSheet's "bounce already-signed-in visitor" effect + `onGoogle`
raced the same navigation from the (still-stacked) transparentModal sign-in sheet. **Fix:** `auth/index`
navigates IMPERATIVELY once (ref-guarded): `router.canDismiss?.() && router.dismissAll()` (try/catch) to
tear down the auth modal stack, then `router.replace(ROUTES.home)` — the gate-free home TAB, never the
gated dashboard. AuthSheet gets an `oauthHandoffRef` (set true at `onGoogle` start, cleared only on a
genuine non-cancelled error) that suppresses its auto-bounce effect so it can't compete with the
deep-link callback. Land OAuth on a gate-free route; let ONE screen own post-login navigation.

**Build:** JS-only, so it works in Expo Go but Play testers need a fresh EAS build to verify.
