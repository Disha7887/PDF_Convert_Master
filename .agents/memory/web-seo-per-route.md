---
name: Per-route SEO (web SPA)
description: How per-page SEO metadata is driven in the pdf-convert-master SPA, and the limits of code-only SEO.
---

# Per-route SEO in pdf-convert-master

The web app is a client-rendered SPA, so all routes shared a single `<title>`/meta
from `index.html` until per-route metadata was added.

- `src/lib/useSeo.ts` is a dependency-free hook (uses wouter `useLocation`) that, on
  each route, updates `document.title`, meta description, canonical link, OG/Twitter
  tags, robots directive, and optional JSON-LD. It creates head tags if missing and
  updates them in place otherwise (so no duplicate tags vs `index.html` baseline).
- Brand suffix " | PDF Genius" is auto-appended unless the title already contains the
  brand. `SITE_URL = https://pdfgenius.app`; canonicals always resolve to that origin.
- Tool pages get SEO centrally via `ToolPageShell.tsx` (one integration point for
  ~40 tool routes, adds WebApplication JSON-LD). Marketing pages call `useSeo` each.
- Private/account routes (SignIn, SignUp, ForgotPassword, ResetPassword, Dashboard,
  Profile) pass `noindex: true` → `robots: noindex,nofollow`.

**Why:** the domain wasn't surfacing in Google; the main gap was per-route metadata,
not the baseline (index.html meta + public/robots.txt + public/sitemap.xml already
existed and were comprehensive).

**How to apply:** any new public page should call `useSeo({title, description,
canonicalPath})`; any new private page should add `noindex: true`. Code SEO alone
will NOT make the site index instantly — the owner must verify the domain in Google
Search Console and submit `https://pdfgenius.app/sitemap.xml`, then wait for crawl.
