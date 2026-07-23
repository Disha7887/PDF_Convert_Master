---
name: Hidden admin dashboard
description: Policy rules for admin auth and the per-tool pause kill-switch.
---

- Admin is NOT a customer account: credentials come from ADMIN_USERNAME/ADMIN_PASSWORD secrets (must also be set on Railway for prod). Admin JWTs carry `scope:"admin"`; user JWTs must NEVER be issued a scope — that field is the sole separation boundary.
- **Why:** owner wanted a single hidden admin fully separate from customers; any scope on a user token would grant admin access.
- Tool pause state is DB-backed and must be enforced at EVERY conversion entry point — including tool-specific routes (e.g. images-to-pdf-style dedicated endpoints), not just the generic convert route. Any new endpoint that starts a conversion job must check paused state first and return a friendly 503.
- The v1 API docs-offline list is a separate, unrelated mechanism; don't merge or seed it into the pause table.
- Never commit admin credentials anywhere (including dev env vars in `.replit`); use Replit Secrets via requestSecrets.

**Public pause probe:** `GET /api/tools/paused` (no auth, paused types only) must stay registered BEFORE `/api/tools/:toolType` or "paused" is captured as a toolType. Clients (web `usePausedTools`, mobile `services/pausedTools`) fail open — server pause checks remain the backstop. Pause state is cached ~seconds server-side and fetched once per page load client-side (module cache).
