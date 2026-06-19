---
name: Vite build passes on missing component imports
description: A green `npm run build` does not catch an unimported JSX component — it only fails at runtime in the browser.
---

# Vite/esbuild does not catch a missing component import

If a `.tsx` file uses a JSX component (e.g. `<ToolLottieIcon .../>`) but forgets
to `import` it, `npm run build` (vite + esbuild) STILL SUCCEEDS. esbuild treats
the bare identifier as an undeclared global reference rather than a compile
error. The failure only appears at runtime: the browser throws
`X is not defined` and React unmounts the component tree (red error overlay).

**Why:** this build is not type-checked by `tsc` as a build gate; esbuild does
fast transpilation without full symbol resolution, so undefined identifiers slip
through to runtime.

**How to apply:** a passing `npm run build` is necessary but NOT sufficient.
After adding a new component usage, always load the affected page in the
preview/screenshot to confirm it actually renders. When you split a component
into a new file and reference it from multiple files, add the import to EVERY
consuming file, not just the first one.

**Same trap, silent variant — wrong destructured field name.** Because there is
no `tsc` gate, destructuring a field that doesn't exist (e.g.
`const { isLoading } = useAuth()` when the context only exposes `loading`)
compiles fine and yields `undefined` at runtime, so `if (isLoading) {...}` never
fires and the branch silently no-ops (no error, no overlay). `AuthContext` here
exposes `loading` (boolean, starts `true`), NOT `isLoading`. When wiring a
loading/auth gate, grep the context for the real field name first; a green build
will not tell you the gate is dead.
