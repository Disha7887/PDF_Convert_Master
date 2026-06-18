---
name: PDF Convert Master conversion engine decisions
description: Durable constraints for the real file converters in server/routes.ts (HTML→PDF security, deps, the one tool that needs an API key)
---

# All conversions produce REAL files — never reintroduce placeholders
- Every converter in `server/routes.ts` generates a genuine openable file using real libraries (pdf-parse, pdf-lib, docx, xlsx, pptxgenjs, jszip, sharp, puppeteer). The user explicitly rejected fake/sample/placeholder output.
- **Why:** the original complaint was "downloaded files are broken/fake." Any future shortcut that returns a stub or dummy file regresses the core requirement.
- **How to apply:** if a conversion genuinely cannot be done locally, fail loudly with a clear error (see remove_background) rather than emitting a placeholder.

# htmlToPdfBuffer MUST stay locked down (SSRF)
- The Chromium HTML→PDF renderer runs user-controlled HTML. It is deliberately locked: `setJavaScriptEnabled(false)`, `setRequestInterception(true)` aborting every request except `data:`/`about:`/`blob:`, and 20s timeouts on setContent + pdf.
- **Why:** without this, a user could point an `<img>`/resource at internal endpoints (e.g. `169.254.169.254` cloud metadata) = SSRF, or hang the render on a slow external fetch. Architect flagged this as blocking for production.
- **How to apply:** do NOT relax the request filter to allow http/https for "image fidelity." If external assets are ever required, resolve+validate against a public-IP allowlist first. Word→PDF still works because mammoth inlines images as `data:` URIs.

# Chromium is concurrency-limited
- A semaphore (`acquireChromiumSlot`, MAX_CHROMIUM=2) bounds simultaneous browser launches; every `htmlToPdfBuffer` call acquires/releases a slot.
- **Why:** unbounded parallel conversions launch unbounded Chromium processes → memory/CPU exhaustion.
- **How to apply:** route any new Chromium usage through the same slot acquire/release; don't launch puppeteer directly elsewhere.

# remove_background is the ONE tool that needs an external key
- `removeBackground` calls the remove.bg API and throws a clear error if `REMOVE_BG_API_KEY` is unset. It is intentionally NOT faked.
- **Why:** there is no good local background-removal; faking it violated the no-placeholder rule. This was flagged to the user as needing a key.
- **How to apply:** to enable it, set `REMOVE_BG_API_KEY` via the environment-secrets flow. All other 19 tools work with no keys.

# Compile/test gates for the converters
- Use `npm run build` as the compile gate (`npm run check` fails on unrelated pre-existing `server/routes_broken.ts`).
- End-to-end test path: POST `/api/convert` (multipart: file, toolType snake_case, fileName, fileSize, optional options JSON) → poll GET `/api/jobs/:jobId` until completed → GET `/api/download/:jobId`. Verify output by file magic bytes (PDF `%P`, ZIP/OOXML `PK`, PNG, JPEG).
- code_execution sandbox quirks: `Blob` is not global (`const {Blob}=await import('buffer')`); pdf-lib `addPage([w,h])` works against the live server but fails inside the sandbox itself.
