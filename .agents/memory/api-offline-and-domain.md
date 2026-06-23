---
name: API reference offline tools + custom domain
description: How "offline" public API tools are gated and why the API docs hardcode the custom domain.
---

# Offline public API tools

Some tools are documented in the web API reference but must NOT have a live `/api/v1` endpoint (they are "coming soon" in the app, so the public API is offline too).

- The offline set is duplicated in two places that MUST stay in sync:
  - api-server: `OFFLINE_API_TOOLS` (a `Set<string>`) gates `POST /api/v1/:toolType` → returns `503 {success:false, status:"offline", error}`. The check sits AFTER `authenticateApiKey` and BEFORE ToolType validation, so a documented-but-not-in-enum tool (e.g. `edit_pdf`) returns offline instead of "unknown tool".
  - web APIReference page: `OFFLINE_TOOL_TYPES` drives an "Offline" badge + 503 note.
- **Why two sources:** web and api-server are separate artifacts and don't share a lib for this. Acceptable for a 2-element set; if it grows, promote to a shared lib.
- **How to apply:** when a tool's availability changes, update BOTH sets together.

# edit_pdf is a docs-only synthetic endpoint

`edit_pdf` is NOT in the `ToolType` enum or `/api/tools`. The reference appends a synthetic `EDIT_PDF_TOOL` entry (only if `/api/tools` doesn't already list it) and marks it offline. It represents the individual "Edit PDF" tool, not the "Edit" tool category. ToolCategory enum has no edit value, so no collision.

# API docs hardcode the custom domain

The API reference base URL and landing curl example are hardcoded to `https://pdfgenius.app` (not `window.location.origin`). **Why:** docs must always show the canonical public API domain, never the Replit dev/preview origin the page happens to be viewed on.
