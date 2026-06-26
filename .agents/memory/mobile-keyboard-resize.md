---
name: Mobile keyboard / soft-input mode
description: Android keyboard hiding bottom inputs in pdf-convert-mobile
---

For the on-screen keyboard to push content up (so bottom inputs aren't hidden), Android **must** use `softwareKeyboardLayoutMode: "resize"` in `app.json` (expo.android), NOT `"pan"`.

**Why:** `react-native-keyboard-controller` (KeyboardProvider + KeyboardAwareScrollView in `components/ui.tsx` ScreenScroll) and RN's `KeyboardAvoidingView` (used in AuthSheet/DownloadFormatModal) all rely on the window *resizing* when the keyboard opens. With `"pan"` the OS just shifts the window and the keyboard-aware scrolling fails, leaving bottom inputs hidden.

**How to apply:** Keep `softwareKeyboardLayoutMode: "resize"`. This is a NATIVE manifest change (`android:windowSoftInputMode=adjustResize`) — it only takes effect in a fresh EAS build/APK, not via a JS hot-reload of the existing install.

**Transparent-modal exception (auth screens).** `resize` is NOT enough for the sign-in/sign-up sheets: they are presented as `presentation: "transparentModal"` (app/_layout.tsx), and on Android a transparent modal lives in its OWN window that does NOT inherit the activity's `adjustResize`. So even on a build that has `resize`, the keyboard covered the AuthSheet inputs because its `KeyboardAvoidingView` had `behavior={undefined}` on Android. **Fix:** AuthSheet KAV must use `behavior={Platform.OS === "ios" ? "padding" : "height"}` — `"height"` shrinks the fill view so the bottom-anchored sheet floats above the keyboard. Any future full-screen `transparentModal` with bottom inputs needs an explicit Android KAV behavior, not just the manifest setting.
