---
name: pdfjs version singleton (server)
description: Why api-server's pdfjs-dist must match pdf-parse's exact version, use the legacy Node build, and be externalized as a subpath wildcard in esbuild.
---

# pdf.js + pdf-parse must share ONE version in a Node process

When the server imports `pdfjs-dist` directly (e.g. to `getTextContent` for the
mobile Edit-Text endpoint) AND also uses `pdf-parse` (which renders via pdf.js),
both must resolve to the SAME `pdfjs-dist` version.

**Why:** pdf.js keeps a **process-global worker singleton**. Loading two
different pdfjs-dist versions in one process throws at runtime:
`The API version "X" does not match the Worker version "Y"`. `pdf-parse@2.4.5`
pins `pdfjs-dist@5.4.296`; api-server had `4.7.76`, so the first call after both
loaded blew up.

**How to apply:**
- Pin api-server's `pdfjs-dist` to the EXACT version `pdf-parse` resolves
  (`pnpm --filter @workspace/api-server add pdfjs-dist@<that version>`) so pnpm
  dedupes to a single store copy. Check with:
  `readlink -f artifacts/api-server/node_modules/pdfjs-dist` vs
  `node_modules/.pnpm/pdf-parse@*/node_modules/pdfjs-dist`.
- Import the **Node legacy build**: `import("pdfjs-dist/legacy/build/pdf.mjs")`.
  The bare entry works for `getTextContent` but logs
  `Please use the legacy build in Node.js environments.` and isn't fully Node-safe.
- esbuild: externalizing bare `"pdfjs-dist"` does NOT cover the subpath import.
  Add `"pdfjs-dist/*"` to the `external` list too, or esbuild bundles the heavy
  legacy build. Verify it stayed external: `rg -c "function getDocument" dist/index.mjs` → 0.

**Rotation caveat:** `pdf-parse.getScreenshot` has NO rotation option, so the
native render/colour raster uses the page's default `/Rotate`, while pdf.js text
extraction is forced to `rotation:0`. For `/Rotate` PDFs the native editor (all
tools, not just Edit Text) is already unrotated-space only — a pre-existing
limitation; fixing it needs a server-side pdf.js→canvas render path.
