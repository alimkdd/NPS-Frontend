// Stores the JWT issued by the admin WebAuthn login ceremony. Persisted to
// sessionStorage (per-tab), cleared on sign-out or 401 from the API.
const TOKEN_KEY = 'nps.adminToken';
const EXPIRY_KEY = 'nps.adminTokenExpiresAt';
const DISPLAY_KEY = 'nps.adminDisplayName';

export interface StoredSession {
  accessToken: string;
  expiresAtUtc: string;
  displayName: string;
}

export const adminSession = {
  set(session: StoredSession): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, session.accessToken);
      sessionStorage.setItem(EXPIRY_KEY, session.expiresAtUtc);
      sessionStorage.setItem(DISPLAY_KEY, session.displayName);
    } catch {
      /* sessionStorage unavailable */
    }
  },
  getToken(): string | null {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const expiry = sessionStorage.getItem(EXPIRY_KEY);
      if (!token || !expiry) return null;
      // Treat the token as expired 30s early to avoid edge clock drift causing 401s mid-request.
      if (new Date(expiry).getTime() - 30_000 < Date.now()) {
        adminSession.clear();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },
  getDisplayName(): string | null {
    try {
      return sessionStorage.getItem(DISPLAY_KEY);
    } catch {
      return null;
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
      sessionStorage.removeItem(DISPLAY_KEY);
    } catch {
      /* noop */
    }
  },
  isAuthenticated(): boolean {
    return adminSession.getToken() !== null;
  },
};
