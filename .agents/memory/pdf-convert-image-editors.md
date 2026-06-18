---
name: PDF Convert image editor tools (crop/resize/rotate/upscale)
description: Durable design + security rules for the four bespoke image-tool pages, the unified /image-editor, and the /api/uploads endpoint
---

# Unified /image-editor chains ops via one in-browser working blob
- Besides the per-op `/upload/*` pages, there is a single-screen editor at `/image-editor` (`client/src/pages/ImageEditor.tsx`, reached from the nav). It holds ONE working image `{blob,url,width,height,name}`; each modal (resize/crop/rotate) reads the current image, renders to `<canvas>`, returns a blob, and on Apply that blob becomes the new working image — so edits compose (resize→rotate→crop).
- It is 100% client-side (same canvas helpers in `client/src/lib/imageTools.ts`); it does NOT call the server. Output format is constrained by `exportExtension` (jpg/jpeg/png/webp) and JPEG output gets a white background fill.
- **Why:** keeps chained editing instant/offline; matches the existing crop/resize/rotate client-side approach.
- **How to apply:** when adding an op, follow the read-current→canvas→blob→commit pattern and revoke the previous object URL (unless it equals the original) to avoid leaks; revoke on the catch path too.

# Crop/Resize/Rotate edit client-side; only Upscale hits the server
- The Crop, Resize, and Rotate pages do all editing in the browser via `<canvas>` (shared helpers in `client/src/lib/imageTools.ts`), then offer Download + "Save to server". They never call `/api/convert`.
- Upscale is the only one that uses the server pipeline: POST `/api/convert` (toolType `upscale_image`) → poll `/api/jobs/:id` → GET `/api/download/:id` (download deletes the file after the first fetch — fetch once into a blob).
- **Why:** keeps the common edits instant/offline and avoids server load; upscale needs real AI so it must go server-side.
- **How to apply:** don't route crop/resize/rotate through the server unless adding a server-only capability; preserve the page export names `CropImageUpload`/`ResizeImageUpload`/`RotateImageUpload`/`UpscaleImageUpload` used in `client/src/App.tsx`.

# /api/uploads is an in-memory image target that MUST stay hardened
- `/api/uploads` (POST) saves a client-edited image to an in-memory Map (1h TTL) and returns a shareable `/api/uploads/:id` URL. It is public (guests use the tools, like `/api/convert`).
- Locked down: dedicated `imageUpload` multer (25MB, image mimetypes only), Sharp `metadata()` validation rejecting non-raster (SVG excluded — it can carry scripts), Sharp re-encode to strip active content, server-derived mime + sanitized filename, per-IP rate limit, aggregate caps (entries + total bytes). GET serves with `X-Content-Type-Options: nosniff` + `Content-Security-Policy: default-src 'none'; sandbox`.
- **Why:** an unauthenticated in-memory store + inline serving of client-controlled bytes is a stored-XSS + memory-DoS vector. Architect flagged this as blocking.
- **How to apply:** do NOT relax to accept arbitrary mimetypes, skip the Sharp re-encode, or drop the nosniff/CSP headers. Same spirit as the htmlToPdfBuffer SSRF lock.

# Upscale uses Replicate Real-ESRGAN and fails loudly if unconnected
- `upscaleImage` calls Replicate (Real-ESRGAN). Token resolves via the Replicate connector proxy (falls back to `REPLICATE_API_TOKEN`); output fetch is guarded by an SSRF host allowlist. If no token/connection, it throws a clear error rather than faking output.
- **Why:** consistent with the no-placeholder rule and the remove_background precedent — no good local upscaler, so don't fake it.
- **How to apply:** to enable, connect the Replicate integration (or set `REPLICATE_API_TOKEN`). Upscale tool `inputFormats` in `server/storage.ts` must include any format the client accepts (jpg/jpeg/png/webp) or `/api/convert` 400s before processing.
