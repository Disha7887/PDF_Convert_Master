---
name: PDF Convert Master — repo gotchas
description: Non-obvious constraints for the PDF Convert Master repo (which frontend is live, build gate behavior, forbidden files).
---

# PDF Convert Master — repo gotchas

- **The LIVE frontend is `client/` ONLY.** A `frontend/` directory also exists but is a standalone Builder.io copy and is NOT served. Editing `frontend/` has zero effect on the running app. Always edit `client/`.
  **Why:** the repo was restructured for a Builder.io → GitHub pipeline, leaving a second, inert React app behind.

- **`npm run build` is the build gate but does NOT type-check.** It runs Vite + esbuild only, so TypeScript type errors pass the build silently. Don't treat a green build as proof of type-correctness; rely on the LSP/diagnostics for types.

- **Forbidden to edit** (treat as off-limits unless the user explicitly asks): `package.json`, `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`, `tsconfig.json`, and any backend/endpoint code. Brand accent color = blue.

- **Header topology:** `DynamicLayout` mounts EITHER `NavigationSection` (guest) OR `DashboardHeader` (authed), never both. So component-local global key listeners (e.g. Cmd/Ctrl+K in `ToolSearch`) are safe today — but if a second instance is ever mounted (e.g. mobile menu), lift the listener to a singleton/provider to avoid duplicate toggles.

- **Desktop nav (`NavigationSection`) is width-tight at the `lg` breakpoint (~1280px).** Home + two tool dropdowns + Pricing/About + the `ToolSearch` box + Log In + the right-side CTA already fill the row. Keep the right-side CTA label short (~10–11 chars, e.g. "API Access"); a longer label clips/overflows at 1280px. The mobile menu CTA is full-width so it can carry the longer label.
