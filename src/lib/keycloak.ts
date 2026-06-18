import Keycloak from 'keycloak-js';

// Keycloak browser adapter. Config must line up with the realm the backend imports
// (NPS repo: keycloak/realm-export.json) — realm `nps`, public PKCE client `nps-admin-spa`.
const url = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080';
const realm = import.meta.env.VITE_KEYCLOAK_REALM ?? 'nps';
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'nps-admin-spa';

export const keycloak = new Keycloak({ url, realm, clientId });

let initPromise: Promise<boolean> | null = null;

/**
 * Initialises Keycloak exactly once. keycloak-js throws if `init()` is called more than
 * once on an instance, and React 19 StrictMode double-invokes effects in dev, so the call
 * is memoised. Uses silent SSO (hidden iframe) to restore an existing Keycloak session on
 * page load without a visible redirect; falls back to the login button if no session exists.
 */
export function initKeycloak(): Promise<boolean> {
  initPromise ??= keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: 'S256',
  });
  return initPromise;
}

/**
 * Returns a currently-valid Keycloak access token, refreshing it if it expires within 30s.
 * Returns null when the user isn't signed in via Keycloak (the passkey fallback is checked
 * separately) or when a refresh fails.
 */
export async function getKeycloakToken(): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  try {
    await keycloak.updateToken(30);
  } catch {
    return null;
  }
  return keycloak.token ?? null;
}

export function redirectToKeycloakLogin(): void {
  keycloak.login({ redirectUri: `${window.location.origin}/admin/subscriptions` });
}

export function keycloakLogout(): void {
  keycloak.logout({ redirectUri: `${window.location.origin}/admin` });
}

/** Display name from the ID/access token (`name`, then `preferred_username`). */
export function keycloakDisplayName(): string | null {
  if (!keycloak.authenticated) return null;
  const parsed = keycloak.tokenParsed as { name?: string; preferred_username?: string } | undefined;
  return parsed?.name ?? parsed?.preferred_username ?? 'Administrator';
}
