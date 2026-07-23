/**
 * Tawk.to visitor identity bridge.
 *
 * The widget itself is embedded in index.html; this module only pushes visitor
 * attributes (name/email) into it so support agents can see who they're
 * chatting with. Calls are queued via Tawk_API.onLoad when the widget hasn't
 * finished loading yet, and are silent no-ops if the embed script is blocked
 * (ad blockers) or absent.
 */

type TawkAPI = {
  setAttributes?: (
    attributes: Record<string, string>,
    callback?: (error?: unknown) => void,
  ) => void;
  onLoad?: () => void;
  [key: string]: unknown;
};

declare global {
  interface Window {
    Tawk_API?: TawkAPI;
  }
}

/** Run fn now if the widget is ready, otherwise chain it onto Tawk's onLoad. */
function whenTawkReady(fn: () => void) {
  if (typeof window === "undefined") return;
  const api: TawkAPI = (window.Tawk_API = window.Tawk_API || {});
  if (typeof api.setAttributes === "function") {
    fn();
    return;
  }
  const previousOnLoad = api.onLoad;
  api.onLoad = () => {
    if (typeof previousOnLoad === "function") previousOnLoad();
    fn();
  };
}

/**
 * Identify (or anonymize) the current Tawk.to visitor.
 * Pass a user's name/email after login; pass null on logout to clear the
 * identity so the next chat on this browser doesn't show stale account info.
 */
export function setTawkVisitor(visitor: { name: string; email: string } | null) {
  whenTawkReady(() => {
    const api = window.Tawk_API;
    if (!api || typeof api.setAttributes !== "function") return;
    const attributes = visitor
      ? { name: visitor.name, email: visitor.email }
      : { name: "", email: "" };
    try {
      api.setAttributes(attributes, (error) => {
        // Tawk rejects invalid values (e.g. empty email when clearing) — that's
        // fine, agents simply see the visitor as anonymous again.
        if (error && visitor) console.warn("Tawk setAttributes failed:", error);
      });
    } catch (error) {
      if (visitor) console.warn("Tawk setAttributes threw:", error);
    }
  });
}
