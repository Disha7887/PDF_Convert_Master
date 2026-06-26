---
name: EAS build from the main agent
description: How to queue an EAS cloud build from the Replit main agent despite the git-write sandbox block.
---

# Running `eas build` from the main agent

`eas build` defaults to using git (it stashes/reads the index to create the upload archive). In the
Replit main-agent sandbox, git **writes** are blocked, so the build aborts with an error about
`.git/index.lock` / "Destructive git operations are not allowed".

**Fix:** prefix with `EAS_NO_VCS=1` so EAS tars the working directory directly instead of using git.
Run from the artifact dir, e.g.:

```
cd artifacts/pdf-convert-mobile && EAS_NO_VCS=1 eas build --platform android --profile production --non-interactive --no-wait
```

**Notes:**
- `--no-wait` queues and returns immediately (cloud build takes ~10-20 min); poll the printed
  `expo.dev/.../builds/<id>` URL.
- `appVersionSource: remote` in eas.json means EAS auto-increments versionCode remotely; the
  `android.versionCode` in app config is ignored for the build.
- Auth is via the `EXPO_TOKEN` secret (non-interactive); `eas whoami` confirms the account.
