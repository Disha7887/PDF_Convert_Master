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
