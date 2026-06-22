---
name: vite.config must not throw on missing PORT/BASE_PATH
description: Why the pdf-convert-master web deploy build failed and how config must degrade
---

# vite.config env vars vs. the production build step

The production **build** step (`vite build`) loads `vite.config.ts` in an environment
where the artifact's `[services.env]` (PORT, BASE_PATH) is NOT guaranteed to be
injected — those are runtime/serve env, not build env. A config that *throws* at
load time when PORT/BASE_PATH are absent makes the deploy build fail before it starts.

**Rule:** `vite.config.ts` must load without throwing when PORT/BASE_PATH are unset.
Fall back to defaults (`port=5173`, `basePath="/"`); only validate the port for
dev/serve/preview (gate on `process.argv` including `dev`/`serve`/`preview`).

**Why:** the dev workflow always provides PORT/BASE_PATH, so the strict throw only
ever bit the deploy build. base `"/"` is correct for the root-domain static deploy.

**How to apply:** any artifact whose config reads required env at module load — keep
the read non-fatal for `build`, fatal only for the serving commands.
