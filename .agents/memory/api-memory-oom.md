---
name: api-server in-memory buffer OOM
description: Why production OOM-crashed on Railway and the buffer-lifecycle rules that prevent it.
---

# api-server RAM discipline (Railway OOM)

**Rule:** any Map that holds raw file Buffers keyed by job id MUST have a full
lifecycle: touch timestamp on set, purge on download/delete/failure, and a
periodic TTL sweep (30 min TTL, 5 min sweep, `unref()`d) with an orphan purge
for entries lacking a timestamp. Free the uploaded input buffer immediately
after conversion — it is never read again.

**Why:** production crashed on Railway with "Deploy Ran Out of Memory". Job
buffers (input + output + OCR text) were only freed when the user downloaded or
deleted; never-downloaded jobs leaked forever. multer.memoryStorage plus
puppeteer/sharp/tesseract spikes finished the container off.

**How to apply:** eviction is safe because completed outputs and OCR text are
persisted to durable object storage at completion, and /api/download +
resolveOcrPages fall back to the durable copy. Any NEW in-memory buffer store
must follow the same pattern (or reuse touchJobBuffers/purgeJobBuffers).
Remaining known pressure: multer.memoryStorage keeps whole uploads in RAM —
if OOM recurs, move big-upload routes to disk/stream and/or raise Railway
memory.
