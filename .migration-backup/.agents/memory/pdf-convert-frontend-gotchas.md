---
name: PDF Convert Master frontend gotchas
description: Non-obvious traps when editing/theming this Figma-exported React app
---

# Which frontend is live
- The running app serves `client/` (Vite). `frontend/` is a SEPARATE standalone Builder.io copy that is NOT served.
- **Why:** editing `frontend/` has zero effect on the running app and silently wastes effort.
- **How to apply:** make all UI/theme edits in `client/src/**`.

# Theming = literal class/hex find-replace (no dark-mode)
- This app is Figma-exported: colors are hard-coded Tailwind utilities + arbitrary hex values (e.g. `bg-[#111726]`, `text-[#9ca2af]`, `[font-family:'Pacifico',Helvetica]`). It does NOT use Tailwind `dark:` variants or CSS theme tokens for most surfaces.
- **How to apply:** recolor by find/replacing the literal classes/hex per file (sed works well for repeated strings). Brand color is RED; light palette = bg gray-50/white, headings gray-900, body gray-600, borders gray-200.

# White-filled figma SVG icons go invisible on light buttons
- `client/public/figmaAssets/margin-wrap-*.svg` are `fill="white"` and used as button icons. Fine on red/gradient buttons (white-on-red) but INVISIBLE on white/outline buttons.
- **How to apply:** when a button has a light/white/outline background, replace the white SVG `<img>` with a `lucide-react` icon colored `text-gray-700` (or `text-red-600`).

# `npm run check` has a pre-existing unrelated failure
- `npm run check` (tsc) fails due to syntax errors in `server/routes_broken.ts`, unrelated to frontend work. `npm run build` succeeds.
- **How to apply:** don't treat `npm run check` failures from `routes_broken.ts` as caused by your change; use `npm run build` as the compile gate.

# Backend edits need a manual workflow restart (no hot-reload)
- The `Start application` workflow runs `tsx server/index.ts` (NOT `tsx watch`). Vite hot-reloads the `client/` frontend, but server/* changes do NOT take effect until you restart the workflow.
- **Why:** after editing server logic, live API tests kept showing the OLD behavior until a restart — easy to misread as "my fix didn't work."
- **How to apply:** after any edit under `server/`, restart the `Start application` workflow before testing the API.
