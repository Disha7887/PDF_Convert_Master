---
name: First-party conversion endpoints must be optional-auth
description: Why /api/convert, /api/merge-pdfs, /api/uploads must NOT require a JWT/API key, and where strict API-key gating actually belongs.
---

# First-party converter endpoints are free / optional-auth

The web + mobile converter UI calls these api-server endpoints directly:
`POST /api/convert`, `POST /api/merge-pdfs`, `POST /api/uploads`.

**Rule:** these three must use **optional** auth (`optionalConversionAuth`),
never strict `requireConversionAuth`. They are the FREE first-party tool:
- the mobile app sends **no** Authorization header at all,
- logged-out web users send none either,
- logged-in web users send a Bearer JWT via `authedFetch` only when a token exists.

Requiring auth here returns `401 "Authorization header is required"` and breaks
**every** converter for anonymous + mobile users.

**Why:** A task once added `requireConversionAuth` to gate these endpoints
("protect conversion endpoints with JWT/API-key auth"). That silently broke the
whole product — the converters are meant to be free, and there is no login wall
in front of the tool UI.

**How to apply:**
- `optionalConversionAuth` attaches `req.user`/`authSource` when a valid JWT or
  `sk-` API key is present (and records API-key last-used), but ALWAYS calls
  `next()` — invalid/expired/missing credentials just fall through as anonymous.
  Handlers already read `(req as ConversionAuthRequest).user?.id || null` and
  `authSource || "web"`, so anonymous conversions log as anonymous.
- A stale/invalid JWT in web localStorage must NOT break conversions — optional
  auth treats it as anonymous rather than 401.
- Programmatic / external API access is gated SEPARATELY: `POST /api/v1/:toolType`
  uses strict `authenticateApiKey`. Dashboard/key-management routes stay
  JWT-protected. So keeping first-party endpoints open does not weaken the
  API-key product — don't "fix" it by re-gating the first-party routes.
