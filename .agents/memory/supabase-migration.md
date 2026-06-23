---
name: Supabase as primary DB
description: The pdf-convert app's Postgres lives on Supabase; how the connection is resolved and how data was migrated off Replit's built-in DB.
---

# Supabase is the primary database

The app's PostgreSQL is **Supabase**, not Replit's built-in Postgres.

- Connection is resolved as `SUPABASE_DB_URL ?? DATABASE_URL` in BOTH
  `lib/db/src/index.ts` (runtime pool) and `lib/db/drizzle.config.ts` (push).
  So `drizzle-kit push` and the running server both target Supabase whenever
  `SUPABASE_DB_URL` is set.
- The Replit built-in DB (`DATABASE_URL` + `PG*` vars) still exists as the
  fallback, but is no longer the source of truth.

**Why:** user explicitly wanted Supabase. They believed they'd "given" it but
no Supabase config existed until they provided `SUPABASE_DB_URL` as a secret.

**How to apply:** never assume `DATABASE_URL` is the active DB for this project —
check `SUPABASE_DB_URL` first. To inspect/seed prod-like data, connect with
`SUPABASE_DB_URL`. The code_execution sandbox does NOT expose these secrets in
`process.env`; run DB scripts via bash/node where the workflow env is present.

## Data migration approach (one-off, already done)
Copied all rows Replit -> Supabase non-destructively (insert-only, skip on
conflict, FK-safe ordering). Key gotcha: `conversion_jobs.id` is `serial`
(integer) and Supabase already had rows — insert WITHOUT id (let serial assign)
to avoid PK collisions, then `setval(pg_get_serial_sequence(...))`. All other
tables use uuid PKs so their ids copy as-is with `ON CONFLICT DO NOTHING`.
User password hashes copied verbatim, so migrated users log in unchanged.
