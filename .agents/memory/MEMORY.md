# Memory Index

- [Puppeteer e2e in this Repl](puppeteer-e2e.md) — launch with explicit nix-store chromium executablePath + --no-sandbox; for PdfEditor target `data-testid="page-N"` not the shared `alt="Page N"` (a thumbnail dupes it).
- [PdfEditor element model & text editing](pdf-editor.md) — render order == array order (append all covers before all texts); "Edit text" is a one-shot whole-page convert deduped by position; loadImageElement doesn't cache → batch color sampling.
