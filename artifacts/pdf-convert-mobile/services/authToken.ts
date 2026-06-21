/**
 * Module-level holder for the current auth token.
 *
 * `services/api.ts` (the conversion gateway) is a plain module, not a React
 * hook, so it can't read the token from `AuthContext`. The provider keeps this
 * holder in sync (on login / restore / signout) and the conversion calls read
 * it to attribute jobs to the signed-in user.
 */
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
