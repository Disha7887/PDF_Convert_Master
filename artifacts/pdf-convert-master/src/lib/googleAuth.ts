// Google Identity Services (GIS) popup "code" flow helper.
//
// We keep the existing custom-styled Google button and, on click, run Google's
// OAuth popup to obtain a short-lived authorization code. That code is posted to
// our own backend (/api/auth/google), which exchanges + verifies it and returns
// our normal session JWT. The OAuth client ID is fetched from the backend so we
// don't need a build-time env var on the web bundle.

const GSI_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;
let cachedClientId: string | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google sign-in is unavailable here."));
  }
  const w = window as unknown as { google?: { accounts?: { oauth2?: unknown } } };
  if (w.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (w.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google sign-in.")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function fetchClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  const res = await fetch("/api/auth/google/config");
  const data = await res.json().catch(() => null);
  const clientId: string | undefined = data?.data?.clientId;
  if (!data?.success || !clientId) {
    throw new Error("Google sign-in isn't configured yet.");
  }
  cachedClientId = clientId;
  return clientId;
}

/**
 * Opens the Google sign-in popup and resolves with the authorization code, or
 * rejects if the user closes the popup / an error occurs.
 */
export async function requestGoogleAuthCode(): Promise<string> {
  const [clientId] = await Promise.all([fetchClientId(), loadGsi()]);

  return new Promise<string>((resolve, reject) => {
    try {
      const oauth2 = (
        window as unknown as {
          google: {
            accounts: {
              oauth2: {
                initCodeClient: (config: Record<string, unknown>) => {
                  requestCode: () => void;
                };
              };
            };
          };
        }
      ).google.accounts.oauth2;

      const client = oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: (response: { code?: string; error?: string; error_description?: string }) => {
          if (response?.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (!response?.code) {
            reject(new Error("Google sign-in was cancelled."));
            return;
          }
          resolve(response.code);
        },
        error_callback: (err: { message?: string }) => {
          reject(new Error(err?.message || "Google sign-in was cancelled."));
        },
      });
      client.requestCode();
    } catch {
      reject(new Error("Google sign-in failed to start."));
    }
  });
}
