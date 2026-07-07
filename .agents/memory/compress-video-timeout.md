---
name: Video compression timeout
description: Why compress-video jobs timed out and how the encode speed + client poll window were fixed
---

# Compress-video "Processing took longer than expected"

Two-pass x264 with `-preset medium` on a multi-minute video (~26MB, ~3min) runs
well past the client's poll window, so the web UI gives up and shows
"Processing took longer than expected" even though the file is a perfectly valid
video (NOT the moov/corrupt case).

**Fix (two parts, keep both in sync):**
- Server (`api-server/src/routes.ts` `compressVideo`): encode `-preset` is
  `veryfast`, not `medium`. veryfast two-pass on a 3-min/25MB clip finishes in
  ~44s vs >120s for medium. Size-target accuracy from two-pass is unaffected.
- Web (`ConversionWorkflow.tsx` `pollJobStatus`): `maxAttempts` is 400 (~600s)
  for `toolType === 'compress-video'`, 60 (~90s) for every other tool. Video
  legitimately needs the wider window; don't collapse it back to 60.

**Why:** conversions are async — `/api/convert` returns a jobId immediately and
the encode runs in the background with NO server-side ffmpeg kill timer; the only
timeout is the client poll loop. So slow encodes surface purely as a client-side
"took longer than expected".

**How to apply:** if video jobs time out again, first check encode wall-time
(preset) before touching the client window; if genuinely long videos are the
target, raise the encoder speed further (faster preset / single-pass ABR) rather
than only widening the poll window.
