---
name: Mobile keyboard / soft-input mode
description: Android keyboard hiding bottom inputs in pdf-convert-mobile
---

For the on-screen keyboard to push content up (so bottom inputs aren't hidden), Android **must** use `softwareKeyboardLayoutMode: "resize"` in `app.json` (expo.android), NOT `"pan"`.

**Why:** `react-native-keyboard-controller` (KeyboardProvider + KeyboardAwareScrollView in `components/ui.tsx` ScreenScroll) and RN's `KeyboardAvoidingView` (used in AuthSheet/DownloadFormatModal) all rely on the window *resizing* when the keyboard opens. With `"pan"` the OS just shifts the window and the keyboard-aware scrolling fails, leaving bottom inputs hidden.

**How to apply:** Keep `softwareKeyboardLayoutMode: "resize"`. This is a NATIVE manifest change (`android:windowSoftInputMode=adjustResize`) — it only takes effect in a fresh EAS build/APK, not via a JS hot-reload of the existing install.
