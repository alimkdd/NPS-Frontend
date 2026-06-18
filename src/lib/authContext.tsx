import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { initKeycloak, keycloak, keycloakLogout, redirectToKeycloakLogin } from './keycloak';
import { adminSession } from './session';
import {
  adminDisplayName,
  adminMethod,
  isAdminAuthenticated,
  type AuthMethod,
} from './auth';

interface AuthContextValue {
  /** True once Keycloak's silent SSO check has completed — gate routing on this. */
  ready: boolean;
  isAuthenticated: boolean;
  displayName: string | null;
  method: AuthMethod;
  /** Redirect to the Keycloak login page (Authorization Code + PKCE). */
  loginWithKeycloak: () => void;
  /** Sign out of the active method. Keycloak triggers a full-page redirect to /admin. */
  logout: () => void;
  /** Re-read auth state after a passkey sign-in (which mutates sessionStorage directly). */
  syncSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // A counter we bump to force a re-read of the (non-reactive) keycloak/adminSession state.
  const [version, setVersion] = useState(0);

  const syncSession = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    initKeycloak()
      .then(() => {
        if (cancelled) return;
        // Proactively refresh the access token shortly before it expires.
        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30).catch(() => {});
        };
        // Re-render whenever Keycloak refreshes or its auth state changes.
        keycloak.onAuthSuccess = syncSession;
        keycloak.onAuthRefreshSuccess = syncSession;
        keycloak.onAuthLogout = syncSession;
      })
      .catch(() => {
        // Keycloak unreachable — the passkey fallback still works.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [syncSession]);

  const loginWithKeycloak = useCallback(() => redirectToKeycloakLogin(), []);

  const logout = useCallback(() => {
    if (keycloak.authenticated) {
      adminSession.clear();
      keycloakLogout(); // full-page redirect to /admin
      return;
    }
    adminSession.clear();
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated: isAdminAuthenticated(),
      displayName: adminDisplayName(),
      method: adminMethod(),
      loginWithKeycloak,
      logout,
      syncSession,
    }),
    // `version` is intentionally a dependency: bumping it recomputes the derived auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, version, loginWithKeycloak, logout, syncSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
