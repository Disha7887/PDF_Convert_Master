---
name: Avatar (profile photo) storage
description: Where profile photos live and how delete works
---

Profile photos are stored as image files in **Backblaze B2 (S3)** under key `avatars/<userId>`
(via `avatarStorage.ts` → `s3Storage` putObject/getObject/deleteObject). Supabase Postgres only
holds the link in `users.profile_picture_url` (a relative `/api/auth/avatar/<userId>?v=ts` URL).

**Decision (user-confirmed):** keep avatars in Backblaze alongside all other files — do NOT migrate
them to Supabase Storage. The "DB is in Supabase, files in Backblaze" split is intentional.

**Why:** user explicitly chose "keep photos in Backblaze, no migration" when asked. The DB is already
100% Supabase; nothing is in Replit, so there is no Replit→Supabase transfer to do.

**Delete:** `DELETE /api/auth/avatar` (auth, scoped to `req.user.id`) → `deleteAvatar` (idempotent
`deleteObject`, swallows 404) and sets `profile_picture_url` to `""` (falsy → clients show initials
fallback). Wired in web (`lib/profile.ts#deleteAvatar` + Profile.tsx) and mobile
(`services/profile.ts#deleteAvatar` + `mockApi.deleteAvatar` + account/profile.tsx).
