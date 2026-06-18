---
name: PDF Convert image editor tools (crop/resize/rotate/upscale)
description: Durable design + security rules for the bespoke image-tool pages, the 3 separate popup editor tools, and the /api/uploads endpoint
---

# The "Image Editor" is 3 SEPARATE popup tools, not one combined page
- The user explicitly rejected a single combined editor. The polished design lives in `client/src/pages/ImageEditTools.tsx`, which exports three page components — `ResizeImageTool`/`CropImageTool`/`RotateImageTool` — mounted at `/image-editor/resize`, `/image-editor/crop`, `/image-editor/rotate`. There is intentionally NO bare `/image-editor` index route.
- Nav: per user request, the standalone tools are NOT in the navbar (there is no "Image Editor" nav item in `NavigationSection.tsx` or `DashboardHeader.tsx`). The pages exist only as direct routes; user-facing image editing is surfaced via the Tools-page cards (`toolConfig.ts` ids `resize-images`/`crop-images`/`rotate-images`).
- The Tools-page resize/crop/rotate cards now open MANUAL popups client-side (they import `ResizeModal`/`CropModal`/`RotateModal` + `WorkingImage`, which `ImageEditTools.tsx` exports for this reason) — selecting a file auto-opens the matching modal, Apply edits in-canvas, then Download. They no longer call `/api/convert`. The other ~17 Tools cards keep the server `/api/convert` flow.
- A shared `SingleImageTool` shell does: upload dropzone → on upload the tool's own modal auto-opens → Apply renders to `<canvas>`, returns a blob that becomes the single working image (so the same op can be re-applied), records a history entry, and closes the modal → Download. The 3 modals (ResizeModal/CropModal/RotateModal) live in the same file.
- 100% client-side (`client/src/lib/imageTools.ts`); no server calls. Output format constrained by `exportExtension` (jpg/jpeg/png/webp); JPEG output gets a white background fill.
- **Why:** user wants 3 distinct, separately-named tools; a combined "editor page" was rejected.
- **How to apply:** the user wanted these tools out of the navbar but the pages kept — don't re-add a nav link without asking; follow the read-current→canvas→blob→commit pattern; guard async decodes with a mounted flag + a seq token (`loadSeqRef`) and revoke superseded/erroring object URLs to avoid leaks.

# Older /upload/*-image pages still exist and are a duplicate entry point
- The simpler original tools `ResizeImageUpload`/`CropImageUpload`/`RotateImageUpload` (routes `/upload/resize-image|crop-image|rotate-image`) were left untouched and are still routed in `App.tsx` — a known duplication. They are NOT what the Tools-page cards use anymore (those open the popup modals; see the section above).
- **How to apply:** if you ever consolidate, the Tools cards already give the polished popup UX; the `/upload/*-image` pages can be removed/redirected if the user wants to drop the duplicate entry point.

# Tools-card manual edit: download extension must follow exportExtension, not the input name
- When downloading a popup-edited image from a Tools card, name it `withSuffix(name, suffix, exportExtension(name))` — NOT `withSuffix(name, suffix)`. Canvas re-encodes gif/bmp (anything outside jpg/jpeg/png/webp) as PNG, so keeping the original `.gif`/`.bmp` extension would label PNG bytes wrong.
- **Why:** architect flagged a real mislabel bug; the standalone pages already pass `exportExtension`.
- **How to apply:** any new client-side canvas-export download in this app must derive its extension from `exportExtension`, never from the source filename.

# Convert Image Format: supported output formats are Sharp-limited
- The `convert-image-format` Tools card (server-side `/api/convert`, toolType `convert_image_format`) supports output to PNG, JPG, WebP, GIF, AVIF, TIFF — the full set Sharp/libvips can ENCODE here. BMP and HEIC/HEIF are intentionally excluded: Sharp can't write BMP at all, and this libvips lacks HEVC compression so `.heif()` errors ("Unsupported compression"). AVIF works (it's a HEIF/AV1 container; re-sniffs as `heif`).
- Two places must stay in lockstep: the frontend `<option>` list in `Tools.tsx` AND the backend `allowedFormats` whitelist + `convertImageFormat()` switch in `routes.ts`. The whitelist maps the user value to a fixed extension token (jpeg→jpg, tif→tiff, invalid→png) so the output filename extension can never be attacker-controlled — keep it that way.
- **How to apply:** before adding any new output format, confirm Sharp can encode it in THIS environment (test `.toBuffer()`), add it to all three spots, and add its MIME to `MIME_TYPES`. Don't add BMP/HEIC without first adding real encoder support.

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
