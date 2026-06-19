---
name: Brand color class names
description: client/ uses "red"-named CSS classes that actually render the blue brand accent; renaming them breaks the build.
---

In `client/src/index.css`, the project's single vivid-blue brand accent is delivered through utility/component classes whose NAMES still say "red"/"green":
`from-red-650`, `via-red-650`, `to-red-750`, `hover:via-red-750`, `.btn-red-gradient`, `.btn-green-gradient`, `.btn-blue-gradient`.

All of these are defined (or overridden) in index.css to output the SAME blue pill/gradient — the name is historical, the rendered color is blue.

**Why:** During the site-wide rebrand to white + one blue accent, these were intentionally left named as-is and redefined in index.css. They are referenced by name across many components. Doing a blind find-replace of "red"→"blue" on class names removes the classes the CSS defines, so elements lose their styling and/or the build/HMR breaks.

**How to apply:** When doing color work in `client/`, treat these specific class names as already-blue and DO NOT rename them. Only convert raw Tailwind brand shades (e.g. `bg-red-600`, `text-orange-500`) and inline hex/rgba. Semantic colors stay: red = error/destructive, green = success/completed checkmarks & status badges (incl. pricing feature checks, Active/Paid/Operational), amber/yellow = warning/pending/stars.
