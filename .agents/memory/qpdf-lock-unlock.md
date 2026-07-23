---
name: qpdf lock/unlock PDF
description: How PDF password lock/unlock is implemented in api-server via node-qpdf2 + qpdf binary, and its sharp edges.
---

Lock PDF (`lock_pdf`, AES-256 encrypt) and Unlock PDF (`unlock_pdf`, decrypt) are PDF-in/PDF-out tools that mirror the Document Restore architecture. Engine is the `qpdf` system binary driven by `node-qpdf2`.

**Why a system binary:** pdf-lib cannot encrypt or decrypt. qpdf must be present (installed via system dependencies). If the binary is missing, surface "PDF encryption engine unavailable".

**Buffer corruption gotcha (most important):** node-qpdf2's returned Buffer is string-joined and corrupts binary PDF output. Do NOT use the returned buffer. Instead pass an `output` file path to qpdf, then `fs.readFile` that file. Use temp files under `os.tmpdir()` + `randomUUID()` for both input and output, and clean them up in a `finally`.

**Error shape:** node-qpdf2 rejects with the stderr STRING (not an Error) on non-zero exit, and with an `Error` (ENOENT) if the binary is missing. A `describeQpdfError` helper normalizes both into friendly messages (wrong/missing password vs engine unavailable).

**Password plumbing:** sent from clients as `options.password`. Web (`ConversionWorkflow.tsx`) and mobile (`app/convert/[toolId].tsx`) gate the password input on the tool being lock/unlock only (`needsPassword`), and only include `options.password` for those tools — other tools are untouched.

**No shell injection:** node-qpdf2's API + generated temp paths avoid shell interpolation; do not switch to string-built shell commands.

- PROD (Railway): the runtime image lacks qpdf by default → lock/unlock fail with "PDF encryption engine unavailable". Fix = Railway service variable `RAILPACK_DEPLOY_APT_PACKAGES=qpdf` + redeploy (deploy-time apt, not buildAptPackages). Same class of issue as ffmpeg (see prod-ffmpeg-static.md).
