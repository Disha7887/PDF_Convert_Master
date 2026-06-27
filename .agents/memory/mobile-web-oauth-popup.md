---
name: Google sign-in on pdf-convert-mobile WEB (Expo web / Replit preview)
description: Why the mobile app's Google login on web must use a popup + BroadcastChannel relay, not a same-window redirect or window.opener.
---

# Mobile-on-web Google OAuth = popup + BroadcastChannel relay

This is the Expo app (`pdf-convert-mobile`) running on **web** (Expo web, primarily the Replit preview iframe). It reuses the backend's *mobile* OAuth start/callback (`/auth/google/mobile/start?redirect=...`), NOT the pdf-convert-master GIS code flow.

**Two approaches that DO NOT work on web, and why:**
- **Same-window full-page redirect** (`window.location.assign(startUrl)`): navigates *inside* Replit's preview iframe. Google refuses to be framed → user sees Google's generic **"403. That's an error. We're sorry, but you do not have access to this page."** Google must load in a TOP-LEVEL context.
- **Popup + `window.opener.postMessage`** (incl. expo-web-browser `openAuthSessionAsync` on web): the popup completes OAuth and logs in *inside the popup*, but can't hand the result back. Google's **COOP severs `window.opener`**, so the opener stays stuck on "Connecting…".

**What works:** open Google in a real top-level **popup** (`window.open`, so Google isn't framed), and relay the token from the popup back to the opener over a same-origin **`BroadcastChannel("pdfgenius-oauth")`** (COOP doesn't affect BroadcastChannel).
- Web redirect URL is tagged `?popup=1` (native stays plain `pdfgenius://auth`). `app/auth/index.tsx` detects `params.popup==="1"` (`isOAuthPopup`), broadcasts `{type:"pdfgenius-google-auth",token,error}`, `window.close()`s, and **gates out its own login/navigation effects** so the popup never logs itself in.
- `googleSignin` (AuthContext) awaits the channel message, then runs `completeGoogleLogin(token)` in the ORIGINAL window.

**Do NOT poll `popup.closed` as a cancel signal.** Google's COOP *disowns* the popup handle once it navigates to the consent screen, so `popup.closed` reads `true` while the user is still signing in → false-cancel. Cancellation relies on the channel relay (Google-side cancel comes back as `?popup=1&error=...`) plus a 120s hard-stop timeout.
- **Known/accepted gap:** if the user manually closes the popup *while on Google's own page*, there's no detectable signal — the button spins until the 120s timeout.

Guard `BroadcastChannel` (feature-detect `typeof BroadcastChannel === "undefined"` + try/catch the constructor) so the Promise executor never throws.

**Why:** Replit preview is an iframe (no framing of Google) and Google's COOP breaks opener messaging; this is the only combination that loads Google AND returns control to the app. JS-only change → works in Expo Go / web immediately, but Play testers need a fresh EAS build. Native `openAuthSessionAsync` path is unchanged.
