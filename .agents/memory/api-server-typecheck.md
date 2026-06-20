---
name: api-server tsc vs esbuild
description: Why the api-server tsc typecheck is red but the app still builds/runs, and what not to do about it.
---

# api-server typecheck is pre-existingly red (dead file)

`pnpm --filter @workspace/api-server run typecheck` (`tsc --noEmit`) FAILS on
`src/routes_broken.ts` — an unused, never-imported file committed broken in the
original monorepo port. The real app builds via esbuild (`build.mjs`), which only
bundles from the entry and ignores that file, so the server runs fine.

**Why this matters:** the syntax errors in `routes_broken.ts` *mask* a cascade of
pre-existing, benign `TS7030` ("not all code paths return a value") and one
`TS2345` across many Express handlers in `routes.ts`. They follow the package's
`return res.json()` mixed-return convention and are harmless at runtime.

**How to apply:** do NOT try to "green" the typecheck by excluding/deleting
`routes_broken.ts` as part of an unrelated task — it surfaces ~7+ pre-existing
handler errors and turns a one-line change into a broad refactor (or a
strictness regression via `noImplicitReturns:false`). To verify your own changes
compile, run the typecheck and confirm no errors point at *your* lines; the
`routes_broken.ts` errors are expected noise. Fixing this properly is its own
scoped task, not a side effect.
