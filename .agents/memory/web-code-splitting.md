---
name: pdf-convert-master code splitting
description: Keep web routes lazy-loaded and vendor chunks split correctly to avoid a monolithic bundle and circular chunks.
---

# pdf-convert-master web bundle: keep it split

**Rule:** Every page in `artifacts/pdf-convert-master/src/App.tsx` must stay
`React.lazy`-loaded behind a single `<Suspense>`. Do NOT revert to eager
`import { X } from "@/pages/..."` for routes.

**Why:** Eager-importing all ~55 pages produced ONE ~3.6MB JS chunk (857KB gzip)
loaded on first paint → PageSpeed mobile 30, FCP 6.7s, LCP 7.3s, TBT 2050ms.
Heavy tool libs (pdfjs-dist, pdf-lib, tesseract.js, recharts, lottie) are imported
inside individual page modules, so lazy routes automatically pull them out of the
initial load. After splitting, initial JS ≈ 265KB gzip (~70% smaller).

**How to apply:**
- New pages: add as `const X = named(() => import("@/pages/..."), "X")` (named-export
  helper) or `lazy(() => import(...))` for default exports. Never eager.
- Vite `manualChunks` gotcha: do NOT split React into its own chunk separately from
  React-dependent UI libs (radix, framer-motion, lottie) — that creates **circular
  chunks** (react-vendor ↔ vendor) and load-order warnings. Keep the entire React
  ecosystem together in one `vendor` chunk; only isolate heavy **non-React leaf**
  libs that nothing in the vendor graph imports back: pdfjs, pdf-lib, tesseract,
  lottie, recharts/d3. This is cycle-free because those leaves are referenced only
  from lazy routes.
- `React.ComponentType` works in App.tsx without importing React (UMD global from
  @types/react). `JSX.Element` global does NOT exist (react-jsx transform) — use
  `React.JSX.Element` if needed.
- Unused shadcn/ui primitives don't affect bundle size (unimported = not bundled);
  delete them only for tidiness, and always rebuild to confirm.
