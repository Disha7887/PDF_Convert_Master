---
name: Compress Video (MP4) levels
description: How the MP4 Compressor 3-level picker hits a target size and its failure UX.
---

# Compress Video level picker

3 levels drive a target output size = originalBytes * ratio via ffmpeg TWO-PASS VBR.
Ratios MUST stay in lockstep across all three layers:
- backend `VIDEO_LEVEL_RATIOS` (api-server/src/routes.ts compressVideo)
- web `VIDEO_LEVELS` (pdf-convert-master ConversionWorkflow.tsx)
- mobile `VIDEO_LEVELS` (pdf-convert-mobile app/convert/[toolId].tsx)
Values: high 0.11, medium 0.226, low 0.342.

**Audio budget:** audio bitrate is a bounded 20% share of the target total bitrate
(min 48k, max 128k), NOT fixed 128k — otherwise audio eats the whole budget on
small/medium targets and the file can't hit the estimate. Video floor 64k.
**Why:** tiny/short files still can't hit "high" because of the floors — that's
acceptable, real user videos are MB-sized. Verified 24MB test: 0.108/0.225/0.340.

**Estimate shown to user** = sum of selected valid file sizes * ratio.

# Corrupt-video UX
- ffmpeg "moov atom not found / invalid data found / error opening input" =
  corrupt/incomplete upload (NOT a size limit; api-server accepts 85MB+ fine).
  compressVideo() maps these to a friendly "video appears corrupted..." message.
- Web done-screen (`stage === 'completed'`) is reached even when ALL files fail.
  Gate the green "successfully ..." header on completedFilesCount>0; show an error
  header when allFilesFailed. NOTE the FileUpload status enum value is `'failed'`
  (not `'error'`) — filtering on the wrong string silently no-ops the failure UI.
