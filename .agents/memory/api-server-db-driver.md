---
name: api-server DB driver
description: Which DB connection api-server storage must use so writes hit the right database.
---
api-server `storage.ts` must import `db` from `@workspace/db`, not a local per-artifact `./db` module.

**Why:** A local `artifacts/api-server/src/db.ts` used the Neon driver bound to `DATABASE_URL` (the Replit Postgres), while `@workspace/db` prefers `SUPABASE_DB_URL` (pg driver). With the local import, persistence (e.g. plan switches) silently wrote to the Replit DB instead of Supabase — reads looked stale/wrong with no error. The local `db.ts` was deleted; `storage.ts` is the only consumer.

**How to apply:** Any new api-server persistence should pull the connection from `@workspace/db`. If DB writes "don't show up", check the driver/connection source first.
