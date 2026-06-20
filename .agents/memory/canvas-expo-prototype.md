---
name: Expo app prototype board on canvas
description: How to put the Expo (React Native) mobile app's screens on the canvas as a live prototype board
---

# Expo mobile app → canvas prototype board

To show all screens of the Expo mobile app (`artifacts/pdf-convert-mobile`) on the
canvas as a live, editable prototype board, embed the **live Expo route URLs** as
iframe shapes (mobile size ~420x900).

**Why:** The mockup-sandbox is a vite + react-dom server and cannot render React
Native components, and mockup-extract targets web React components — neither works
for RN screens. Expo is the documented proxy exception, so its running screens are
reachable directly at `https://$REPLIT_EXPO_DEV_DOMAIN/<route>`. The canvas "never
iframe the app URL" rule is about isolating single components; a full-app frame
board for an RN app legitimately uses the live route URLs.

**How to apply:**
- Base = `https://$REPLIT_EXPO_DEV_DOMAIN` (resolve with `echo $REPLIT_EXPO_DEV_DOMAIN`).
- One iframe per route from `constants/routes.ts` (tabs, auth, dashboard suite,
  editors, marketing, convert flow). Group with section header `text` shapes.
- The convert screen renders its stages via a `preview` query param:
  `/convert/<toolId>?preview=processing|success|error` — use these for state frames.
- Frames load as `state: "failed"` if created before Expo is warm; re-setting them
  to `state: "live"` with the correct URL re-triggers the load.
- `presentArtifact({ artifactId: "artifacts/pdf-convert-mobile", shapeIds })` at the end.
