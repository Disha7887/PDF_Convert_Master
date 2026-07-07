---
name: Video compression timeout
description: Why compress-video jobs timed out and how the encode speed + client poll window were fixed
---

# Compress-video "Processing took longer than expected"

Slow x264 encoding on a multi-minute video (~26MB, ~3min) runs past the client's
poll window, so the web UI gives up ("Processing took longer than expected") OR the
progress bar plateaus and looks frozen ("stuck at 95%") even though the file is a
perfectly valid video that DOES eventually complete (NOT the moov/corrupt case).

**Fix (three parts, keep in sync):**
- Server encode strategy (`api-server/src/routes.ts` `compressVideo` level path):
  SINGLE-PASS ABR (`-b:v` + `-maxrate` 1.5x + `-bufsize` 2x) at `-preset veryfast`.
  Evolution: was `medium` two-pass (>120s) → `veryfast` two-pass (~44s) → veryfast
  single-pass (~31s on a 3min/25MB clip) and still hits target size (9.03MB == low).
  Single-pass drops the analysis pass that doubled wall-time on long videos.
- Web poll window (`ConversionWorkflow.tsx` `pollJobStatus`): `maxAttempts` is 400
  (~600s) for `toolType === 'compress-video'`, 60 (~90s) for every other tool.
  Video needs the wider window; don't collapse it back to 60.
- Web progress bar (same `pollJobStatus`): asymptotic curve
  `ceiling - (ceiling-base)*exp(-attempts/40)` (ceiling 99), monotonic via
  `Math.max(prev, next)` — NOT a hard `Math.min(..., 95)` cap. A fixed cap makes a
  long encode look frozen; the curve always keeps inching until real completion.

**Why:** conversions are async — `/api/convert` returns a jobId immediately and
the encode runs in the background with NO server-side ffmpeg kill timer; the only
timeout is the client poll loop. So slow encodes surface purely as a client-side
"took longer than expected".

**How to apply:** if video jobs time out again, first check encode wall-time
(preset) before touching the client window; if genuinely long videos are the
target, raise the encoder speed further (faster preset / single-pass ABR) rather
than only widening the poll window.
