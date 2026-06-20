---
name: Global color rebrand (PDF Convert Master)
description: How to swap a brand color everywhere across both the web (Tailwind) and Expo apps without missing hidden surfaces.
---

To change a brand color everywhere, a per-file find/replace is NOT enough — color leaks through several channels:

1. **Tailwind palette override (web).** The web app uses hundreds of `*-blue-*` utility classes. Override the `blue` color name in `tailwind.config.ts` to the new ramp; this recolors all utilities at once instead of editing 70+ files. (The literal class names stay `blue-*` but render the new color.)
2. **CSS variables (web).** `src/index.css` HSL tokens (`--primary`, `--ring`, `--accent`, `--accent-foreground`, dark-mode variants) and any button-hover `hsl(...)` must be set separately — they don't go through Tailwind.
3. **Raw `rgb()`/`rgba()` literals.** Decorative components (`animated-background.tsx`, `animated-particles.tsx`, `PdfEditor.tsx`) and a few `index.css` gradients hardcode blue as `rgba(37,99,235,...)`, `rgb(96 165 250 / ...)`, etc. A hex-only sweep misses these — sweep both comma and space-separated rgb forms.
4. **Lottie JSON animations.** `src/assets/lottie/*.json` (e.g. the hero `syncing-file.json`) bake colors as normalized `[r,g,b,a]` arrays inside `fl`/`st` shape `c.k`. Parse the JSON and remap blue-dominant fills to coral; nothing else touches these.

**Card vs page distinction:** set `--card` to a soft gray (e.g. `220 20% 97%`) distinct from white `--background`, then normalize genuine card surfaces from `bg-white` to `bg-card`. Leave page-level `<section>` backgrounds and inner device-mockup screens white.

**Mobile (Expo)** has no Tailwind — central tokens in `constants/colors.ts` drive everything; set `card` to gray there too.

**Why:** a "change the brand color" task looks done after a hex swap but blue visibly survives in particle effects, gradients, and the hero Lottie. Verify with screenshots, not just grep.
