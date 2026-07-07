---
name: Compress Video (MP4) levels & format support
description: How the video compressor picks a target size, why ratios must stay in lockstep, and where format allowlists live.
---

# Level picker → target size
3 levels drive target output size = originalBytes * ratio via ffmpeg SINGLE-PASS ABR
(x264 `-b:v` + `-maxrate` 1.5x + `-bufsize` 2x, `-preset veryfast`). Switched off
two-pass because the analysis pass doubled encode time and made longer videos sit
near-complete for a long time (felt "stuck at 95%"); single-pass ABR still lands the
target size accurately (verified 9.03MB == low-ratio target on a 3min/25MB clip).
Ratios MUST stay in lockstep across ALL layers or the shown estimate lies:
backend `VIDEO_LEVEL_RATIOS` (routes.ts), web `VIDEO_LEVELS` (ConversionWorkflow.tsx),
mobile `VIDEO_LEVELS` ([toolId].tsx). Values: high 0.11, medium 0.226, low 0.342.
**Audio budget:** audio bitrate = bounded 20% share of target total bitrate
(min 48k / max 128k), NOT a fixed 128k — fixed audio eats the whole budget on
small/medium targets so the file misses the estimate. Video floor 64k.
**Why:** tiny/short clips still can't hit "high" because of floors — acceptable,
real user videos are MB-sized. Estimate shown = sum(selected valid sizes) * ratio.

# Format support: gated in FOUR places, keep in sync
Input is container-agnostic (ffmpeg auto-detects; output is always mp4), but uploads
are rejected unless the extension is in the allowlist. Four allowlists must match:
- server tool registry `inputFormats` (api-server storage.ts — TWO blocks: MemStorage
  AND DatabaseStorage; both gate /api/convert and /api/v1/:toolType). This is the
  real 400 "Unsupported file format" gate — frontend lists alone don't unblock.
- web `acceptedFormats` in toolConfig.ts AND the CompressVideo page props.
- mobile `acceptedFormats` in constants/tools.ts.
**Why:** expanding only the frontend still 400s at the server registry.

# VFR duration stretch (output longer than source)
Variable-frame-rate inputs (screen/phone recordings) re-encoded without an explicit
output frame rate can come out with a stretched duration (real case: 5-min source →
15-min output, ~3x). Fix: `probeAvgFrameRate()` (ffprobe `avg_frame_rate`, sane
1–120fps guard) → inject `-fps_mode cfr -r <avg>` into EVERY compressVideo ffmpeg
command (level single-pass AND CRF fallback). avg_frame_rate = frames/duration, so
forcing CFR at that rate reproduces the true duration. Harmless on CFR sources
(180s stays 180s). Note: a plain CFR test clip won't reproduce the bug — ffmpeg 6.1
handles simple VFR fine; the cure is still the standard one.

# Corrupt-video UX
ffmpeg "moov atom not found / invalid data found / error opening input" = a
corrupt/incomplete upload (NOT a size limit; server accepts 85MB+). compressVideo()
maps these to a friendly "video appears corrupted…" message.
Web done-screen (`stage === 'completed'`) is reached even when ALL files fail — gate
the green success header/toast on completedFilesCount>0, show error state otherwise.
**Gotcha:** the FileUpload status enum value is `'failed'`, not `'error'`; filtering
on the wrong string silently no-ops the whole failure UI.
