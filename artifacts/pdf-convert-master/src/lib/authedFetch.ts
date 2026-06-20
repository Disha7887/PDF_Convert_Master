// Small fetch wrapper that injects the logged-in user's JWT (stored by
// AuthContext under "auth_token") as a Bearer token. The default react-query
// fetcher only sends cookies, so dashboard/API-platform calls that require the
// JWT use this helper instead.
export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export async function authedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

// Error thrown when a conversion request comes back 401 (expired/invalid JWT or
// a revoked API key). It carries an in-app destination so the UI can render an
// actionable link to either the sign-in page or the API Setup page.
export class AuthError extends Error {
  linkTo: string;
  linkLabel: string;
  constructor(message: string, linkTo: string, linkLabel: string) {
    super(message);
    this.name = "AuthError";
    this.linkTo = linkTo;
    this.linkLabel = linkLabel;
  }
}

// Inspect a conversion response. When the server replied 401, return a
// user-friendly AuthError (with a link target) so callers can throw it instead
// of surfacing a generic "Conversion failed" message. Returns null otherwise.
export function getAuthError(
  status: number,
  serverError?: string,
): AuthError | null {
  if (status !== 401) return null;

  // A revoked/invalid API key (API callers) → point them at API Setup.
  if ((serverError || "").toLowerCase().includes("api key")) {
    return new AuthError(
      "Invalid API key — check your API Setup.",
      "/dashboard/api-setup",
      "Go to API Setup",
    );
  }

  // Otherwise the web session JWT is missing/expired → point them at sign-in.
  const loggedIn = !!getAuthToken();
  return new AuthError(
    loggedIn
      ? "Your session has expired. Please log in again to continue."
      : "Please log in to convert files.",
    "/signin",
    loggedIn ? "Log in again" : "Log in",
  );
}

// Convenience helper that performs an authed fetch and parses JSON, throwing a
// friendly error when the response is not ok.
export async function authedJson<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await authedFetch(url, options);
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || (body && body.success === false)) {
    const message = body?.error || `${res.status}: ${res.statusText}`;
    throw new Error(message);
  }
  return body as T;
}
