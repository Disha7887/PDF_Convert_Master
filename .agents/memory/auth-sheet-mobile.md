---
name: Mobile auth dark sheet
description: Why the pdf-convert-mobile sign-in/sign-up screens are a dark bottom-sheet with email-first progressive disclosure.
---

Mobile auth (`app/auth/sign-in.tsx` + `sign-up.tsx`) both render a shared `components/AuthSheet.tsx` (`mode="signin"|"signup"`). It is a dark bottom-sheet over a full-bleed photo backdrop, intentionally dark even though the rest of the app is light-only by design.

**Email-first progressive disclosure:** step starts at `"email"` (Google/Apple + email field, matching the reference design which shows no password). Pressing Continue advances to `"credentials"`, revealing password (+ name/confirm for signup).
**Why:** the reference design is email-only/magic-link style, but `AuthContext` mock auth requires email+password. Progressive disclosure keeps the minimal look while preserving the working password path. Do not "simplify" by removing the password step — it would break sign-in.

**Social buttons (Google/Apple) are intentional placeholders**, not broken. They surface an honest "isn't set up yet — continue with your email below" notice rather than faking success. Don't wire real OAuth unless explicitly asked (needs provider credentials).

**Branding:** primary action + logo use coral `C.primary` (`#f7433d`); never blue. Sheet uses a local dark palette (`SHEET`), separate from the light theme tokens.
