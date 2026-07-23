---
name: GitHub push path for this repo
description: How to push to Disha7887/PDF_Convert_Master when the Git pane / account token fails, and the push-protection gotcha.
---

# GitHub push path

The Replit Git pane's GitHub token for this project is broken (GitHub returns
"Invalid username or token"; pane shows PUSH_REJECTED/UNAUTHENTICATED). The Git pane
uses a DIFFERENT connection than account-level "Connected services" — reconnecting
there does not help. The `gitPush` callback fails the same way (it hides the real
stderr; a manual `git push --dry-run` reveals it).

**Working recipe:** user's fine-grained PAT is stored as secret
`GITHUB_PERSONAL_ACCESS_TOKEN` (needs Contents: Read and write on the repo).
Push via a temp GIT_ASKPASS script that echoes username `x-access-token` and the
token — never inline the token in the URL/command.

**Push protection:** the repo is push-protection eligible; any commit containing a
real secret (e.g. files like `attached_assets/0_secrets_*.json`) blocks the whole
push with GH013. Fix = `git filter-branch --index-filter 'git rm --cached ...'` over
the unpushed range (history rewrite of unpushed commits IS allowed in this sandbox).
`attached_assets/0_secrets_*` is gitignored — keep it that way.

**Why:** avoids re-diagnosing a multi-step auth failure; the GitHub connector proxy
cannot do git-over-https and withholds raw tokens.
