---
name: TopNav is globally mounted over all tabs
description: How per-screen chrome hiding works for the shared mobile top nav, and why it must be route-aware.
---

# Shared TopNav mounts once over every tab

In pdf-convert-mobile, `components/TopNav.tsx` (home icon + account/people icon over a
blur bar) is rendered ONCE in `app/(tabs)/_layout.tsx`, as a sibling layered above the
`<Tabs>`/`<NativeTabs>`. It is NOT re-rendered per screen.

**Why it matters:** an individual tab screen cannot remove the nav by not rendering it —
it doesn't render it. To hide the nav (or its icons) on a specific screen, the logic must
live INSIDE `TopNav`, gated on the active route via `usePathname()` (compare against
`ROUTES.*`). The Scanner/Camera screen hides it this way (returns `null` on `ROUTES.scanner`).

**How to apply:** for any "hide/adjust the header only on screen X" request, edit `TopNav`
with a `usePathname()` check; do not try to override it from the screen component. Screens
already reserve space with `paddingTop: navTopInset + NAV_BAR_HEIGHT`, so hiding the whole
nav just leaves that screen's own header in the reserved space (fine for the dark Scanner).

# Account icon behaves differently by auth state

The people/account icon's press is auth-gated INSIDE `TopNav`: signed-out → routes to
`ROUTES.signIn` (the dark AuthSheet popup); signed-in → opens an in-component account menu
(a transparent RN `Modal`, `menuOpen` state) anchored top-right under the bar. The menu shows
`user.name`/`user.email` and links to Profile Settings (`ROUTES.settings`), Dashboard
(`ROUTES.dashboardHome`), and a destructive Log out (`signout()` then route to `ROUTES.home`).
It does NOT navigate straight to Settings on tap anymore.

**Why:** users need a logout affordance reachable from anywhere; the icon is the only
persistent account entry point. **How to apply:** the menu lives in `TopNav`, not a screen.
Dismissal uses backdrop `onPress` + inner `stopPropagation()` + `onRequestClose` (Android back).
