import { adminSession } from './session';
import { getKeycloakToken, keycloak, keycloakDisplayName } from './keycloak';

// Unified, non-React admin auth accessors over the two supported methods:
//   1. Keycloak (OIDC, primary)        — token lives in the keycloak-js instance
//   2. WebAuthn passkey (legacy fallback) — token in sessionStorage via adminSession
// Keep this framework-agnostic so the API client can import it without pulling in React.

export type AuthMethod = 'keycloak' | 'passkey' | null;

/** The access token to attach to admin API calls, preferring Keycloak. Null if signed out. */
export async function getAdminToken(): Promise<string | null> {
  const keycloakToken = await getKeycloakToken();
  if (keycloakToken) return keycloakToken;
  return adminSession.getToken();
}

export function isAdminAuthenticated(): boolean {
  return Boolean(keycloak.authenticated) || adminSession.isAuthenticated();
}

export function adminMethod(): AuthMethod {
  if (keycloak.authenticated) return 'keycloak';
  if (adminSession.isAuthenticated()) return 'passkey';
  return null;
}

export function adminDisplayName(): string | null {
  return keycloakDisplayName() ?? adminSession.getDisplayName();
}

/**
 * Clears the local passkey session. Keycloak sign-out is a full-page redirect handled by the
 * auth context; this is safe to call regardless of method (a no-op when Keycloak is active).
 */
export function clearPasskeySession(): void {
  adminSession.clear();
}
