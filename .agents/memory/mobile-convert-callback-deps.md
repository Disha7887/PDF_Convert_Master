---
name: Mobile convert useCallback deps
description: The mobile convert screen's submit callback must list every option-state dep or it sends stale values.
---

The mobile convert screen (`app/convert/[toolId].tsx`) builds its conversion
`options` (password, outputFormat, quality, etc.) inside the `convert`
`useCallback`. Any state that feeds `options` MUST be in the callback's
dependency array, or the callback closes over the INITIAL value and sends stale
data to the server.

**Why:** Lock/Unlock PDF failed with "Please enter a password..." even after the
user typed one — the callback's deps omitted `password`/`needsPassword`, so it
captured the empty initial password.

**How to apply:** When adding a new per-tool option (state used inside `convert`),
add it to the `convert` useCallback deps. Also: any `const` (like `needsPassword`)
referenced in a hook's deps array must be DECLARED ABOVE that hook (TDZ), and made
null-safe (`tool?.id`) since it now runs before the `if (!tool) return` guard.
