---
name: Mobile Google sign-in (Expo)
description: How native Google login works in pdf-convert-mobile and the security rule for the redirect allowlist.
---

# Mobile Google sign-in — backend-mediated browser OAuth

Native Google login reuses the **existing Google WEB OAuth client** (no separate
iOS/Android client IDs). Flow:

1. App opens the system browser (`expo-web-browser` `openAuthSessionAsync`) to
   `GET /api/auth/google/mobile/start?redirect=<app deep link>` on the api-server.
2. `start` validates the deep link, signs it into the OAuth `state` (JWT, 10m),
   and 302s to Google consent with `redirect_uri =
   <PUBLIC_APP_URL>/api/auth/google/mobile/callback`.
3. `callback` verifies the signed state, exchanges the code, `verifyIdToken`
   (audience = web client id), `findOrCreateGoogleUser()` (shared with the web
   popup flow), mints the app JWT, and 302s to the app deep link with
   `?token=...` (or `?error=...`).
4. Mobile `AuthContext.googleSignin()` parses the token, fetches `/auth/user`,
   and persists the session like email login.

**Why this approach:** reuses the one Google web client; the only Google Cloud
change needed is authorizing the callback URL as a redirect URI — no new client
IDs, no native Google SDK.

## Security rule (do NOT loosen)
`isAllowedAppRedirect()` in `api-server/src/auth.ts` must allow ONLY the app's
own custom scheme (`pdfgenius://`) in production. NEVER re-add blanket
`exp://` / `exps://` / `https://auth.expo.io/*` — `/start` is public, so a
crafted `redirect` would forward the minted JWT to an attacker-controlled Expo
bundle/host (token exfiltration). Custom schemes resolve to the on-device app, so
there is no remote host to leak to. Dev/Expo-Go testing opts in via the
`MOBILE_OAUTH_DEV_REDIRECTS` env var (exact-prefix list); set it only in dev.

## Deploy / config requirements (external)
- Authorize `https://pdfgenius.app/api/auth/google/mobile/callback` (and the
  current `*.replit.dev/...callback` for dev) in the Google web client.
- `PUBLIC_APP_URL=https://pdfgenius.app` must be set on the prod (Railway) backend
  so the redirect_uri is built deterministically and matches Google's allowlist.
- Mobile points at prod (`EXPO_PUBLIC_DOMAIN=pdfgenius.app`), so the backend
  changes must be DEPLOYED and a fresh EAS build shipped (new JS + deep-link).

## Testing in the Replit Expo Web preview
- On Expo **web**, `Linking.createURL("auth")` returns the page's own https origin
  (`https://<REPLIT_EXPO_DEV_DOMAIN>/auth`), NOT a custom scheme — so the strict
  allowlist returns "Invalid or missing redirect target." `isAllowedAppRedirect()`
  therefore ALSO trusts `https://<REPLIT_EXPO_DEV_DOMAIN>` but ONLY when
  `NODE_ENV !== "production"` (server-known host, no prod surface).
- Still requires the dev callback `https://<REPLIT_DEV_DOMAIN>/api/auth/google/mobile/callback`
  to be an authorized redirect URI in the Google Cloud web client, or Google
  returns `redirect_uri_mismatch` after consent. The replit.dev domain is stable
  per-repl. (Note: callback is on the `.sisko.replit.dev` host, redirect-back is
  on the `.expo.sisko.replit.dev` host — both belong to this repl.)
