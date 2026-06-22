---
name: Shared enum runtime staleness
description: Why a new ToolType value 400s until the api-server is restarted
---

After adding a value to the `ToolType` enum in `lib/db`, the running api-server keeps
the old compiled enum in memory. `/api/convert` validates `toolType` with
`z.nativeEnum(ToolType)`, so requests with the new value fail with
`{"success":false,"error":"Invalid request data"}` until the server reloads.

**Why:** api-server runs via its own dev process and does not hot-reload changes in the
separate `lib/db` package. The Zod schema closes over the enum snapshot at boot.

**How to apply:** Restart the `artifacts/api-server: API Server` workflow after any
change to a shared `lib/db` enum/schema before testing the endpoint or debugging a
spurious validation failure.
