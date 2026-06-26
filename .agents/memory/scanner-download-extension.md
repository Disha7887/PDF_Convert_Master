---
name: Saved-file download needs extension
description: Why Android "cannot open document" for scanner PDFs — stored name has no extension; must append outputFormat before saveFile.
---

# Saved-file download filename must carry its extension

`StoredFileEntry.name` is a **display name with no file extension** (e.g. `Scan Jun 26`);
the real extension is stored separately in `StoredFileEntry.outputFormat` (`.pdf`/`.jpg`/`.png`).

When downloading from the Files tab, you MUST reconstruct `name + outputFormat` before
calling `saveFile(uri, name)`. If you pass the bare display name:
- `services/files.ts` `mimeFor(name)` resolves to `application/octet-stream`
- `saveAndroid` → `SAF.createFileAsync(dir, name, mime)` writes an **extensionless** file
- Android's Files app then reports **"cannot open document"** on every device.

**Why:** this — not PDF byte generation — was the real root cause of the long-reported
Android scanner "Save as PDF → cannot open" bug. An earlier NaN-page-dimension fix in
scanner `buildPdf` did NOT touch this path, so the bug persisted across builds.

**How to apply:** at any `saveFile` call site for a `StoredFileEntry`, build
`downloadName = outputFormat && !name.endsWith(ext) ? \`${name}.${ext}\` : name`.
Other callers already pass extension-bearing names: `history.tsx` uses `entry.fileName`;
`convert/[toolId].tsx` and the editors build `fullName`. Only the Files-tab download was wrong.

**Sandbox caveat:** do NOT try to validate pdf-lib output under the Replit Node code-execution
sandbox — `pdf-lib@1.17.1` CJS throws `addPage ... type NaN` even for a hardcoded
`addPage([400, 300])`. That's an environment artifact, not a real bug; it misled the earlier
NaN investigation. Verify PDF behavior on-device, not in the sandbox.
