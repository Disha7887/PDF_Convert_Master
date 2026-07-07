---
name: Prod ffmpeg via static npm binaries
description: Why video/ffmpeg features must bundle static binaries instead of relying on the deploy image, and the pnpm/esbuild gotchas.
---

# Prod ffmpeg/ffprobe

Dev has ffmpeg/ffprobe via Nix, but the Railway production image does NOT — any
bare `spawn("ffmpeg"|"ffprobe")` fails in prod with `spawn ffmpeg ENOENT` even
though it works locally.

**Rule:** ship `ffmpeg-static` + `ffprobe-static` as api-server deps and spawn
their resolved absolute paths (`FFMPEG_BIN`/`FFPROBE_BIN`, with
`FFMPEG_PATH`/`FFPROBE_PATH` env overrides as emergency knobs). Do NOT install a
Replit Nix module to "fix" it — that only affects dev, never prod.

**Why:** the deploy image is builder-managed and doesn't include media tools;
static npm binaries make the fix builder-independent and self-contained.

**How to apply / gotchas:**
- pnpm 10 blocks postinstall build scripts by default. `ffmpeg-static` downloads
  its binary in a postinstall, so it MUST be in root `package.json`
  `pnpm.onlyBuiltDependencies`, or the binary never downloads. `ffprobe-static`
  ships prebuilt binaries (no postinstall) so it needs no allowlist.
- Both must be esbuild `external` in build.mjs — they resolve the binary via a
  module-relative path, so bundling breaks it (same reason as sharp/pdfjs).
  Externals require `node_modules` present at runtime, which Railway keeps.
- Any new ffmpeg/ffprobe spawn site must use the resolved bins, never a bare
  string.
