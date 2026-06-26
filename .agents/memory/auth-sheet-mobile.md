---
name: Mobile auth dark sheet
description: Why the pdf-convert-mobile sign-in/sign-up screens are a dark bottom-sheet with email-first progressive disclosure.
---

Mobile auth (`app/auth/sign-in.tsx` + `sign-up.tsx`) both render a shared `components/AuthSheet.tsx` (`mode="signin"|"signup"`). It is a dark bottom-sheet popup, intentionally dark even though the rest of the app is light-only by design.

**Popup, not a full page:** the auth routes are registered as `presentation: "transparentModal"` (in `app/_layout.tsx`) so the sheet floats over whatever screen launched it; the backdrop is a dim scrim (no photo) and tapping it or the X closes. Do not revert it to a full-screen page with a photo backdrop.

**Header is an illustration, not the logo+name:** the brand row (coral file-text logo + "PDF Convert Master") was removed; the sheet header is now a paper-airplane "sign-up" SVG illustration (`constants/signUpIcon.ts`, rendered via `SvgXml`). The source art is black-on-transparent, so its `#000` strokes/fills are recolored to light `#f8fafc` to read on the dark sheet (pink `#FF85D2` accents kept). Same pattern as `constants/celebrateIcon.ts`.

**Result animations (Lottie):** on submit outcomes the sheet swaps to a result view via `components/AuthResultIcon.tsx` (+ `.web.tsx`, paired native/web like `ConverterStatusIcon`): sign-up success = in-sheet `success` checkmark then redirect to sign-in; sign-up/sign-in failure = in-sheet `error` icon + Try Again; sign-in success = a BIG full-screen `welcome` animation (`auth-welcome.json`) then redirect to dashboard.
**Redirect race gotcha:** `AuthContext.signin` flips `isAuthenticated` true *before its promise resolves*, so the "bounce already-signed-in visitor to dashboard" effect must also gate on `!isSubmitting && !result` — otherwise it fires first and skips the welcome animation.

**Email-first progressive disclosure:** step starts at `"email"` (Google/Apple + email field, matching the reference design which shows no password). Pressing Continue advances to `"credentials"`, revealing password (+ name/confirm for signup).
**Why:** the reference design is email-only/magic-link style, but `AuthContext` mock auth requires email+password. Progressive disclosure keeps the minimal look while preserving the working password path. Do not "simplify" by removing the password step — it would break sign-in.

**Social buttons:** Google is REAL (backend-mediated OAuth, see [google-oauth-mobile](google-oauth-mobile.md)). **Apple is intentionally NOT implemented** — tapping it shows a dedicated `result === "unavailable"` state (apple-unavailable.json Lottie + "Apple sign-in unavailable" message + "Got it" dismiss), NOT a placeholder login. The user explicitly does not want Apple set up; do not wire real Apple OAuth unless asked. Web mirrors this exactly in AuthCard.

**Branding:** primary action + logo use coral `C.primary` (`#f7433d`); never blue. Sheet uses a local dark palette (`SHEET`), separate from the light theme tokens.
