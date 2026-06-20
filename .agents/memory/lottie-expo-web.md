---
name: Lottie rendering on Expo web
description: Why Lottie animations silently fall back to Feather on the Expo web build, and the platform-split fix.
---

# Lottie on Expo web

`lottie-react-native` v7 renders on **web** via `@lottiefiles/dotlottie-react`, which
loads a WASM player fetched at runtime. Behind the Replit preview proxy that fetch is
unreliable, so animations silently fall back to a placeholder (Feather icon) on Expo
web while working fine on native.

**Fix:** platform-split the component. Keep `Component.tsx` using `lottie-react-native`
for iOS/Android, add `Component.web.tsx` using `lottie-react` (pure JS, same library the
web artifact `pdf-convert-master` uses successfully). Share the status→animation mapping
in a plain `.ts` module so native and web never drift.

**Why:** the web artifact proved `lottie-react` works behind the proxy; `dotlottie-react`'s
runtime WASM dependency is the fragile part, not Lottie itself.

**How to apply:** any new Lottie component intended to render on Expo web must follow the
`.web.tsx` + shared resolver pattern. Don't rely on `lottie-react-native` for web.
