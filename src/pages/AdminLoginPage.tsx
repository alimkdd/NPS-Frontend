import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { passkey } from '../lib/passkey';
import { useAuth } from '../lib/authContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

// Governs only the secondary passkey fallback section. Keycloak is the primary path.
type PasskeyMode = 'loading' | 'sign-in' | 'enroll' | 'unsupported';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { ready, isAuthenticated, loginWithKeycloak, syncSession } = useAuth();

  // Lazy initial state (instead of a synchronous setState in the effect): WebAuthn support is
  // a stable, synchronous capability check, so resolve it once at mount.
  const [passkeyMode, setPasskeyMode] = useState<PasskeyMode>(() =>
    passkey.isSupported() ? 'loading' : 'unsupported',
  );
  const [username, setUsername] = useState('admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || isAuthenticated) return; // about to redirect, or Keycloak still initialising
    if (!passkey.isSupported()) return; // passkeyMode already 'unsupported' from initial state
    let cancelled = false;
    passkey
      .getStatus()
      .then((status) => {
        if (cancelled) return;
        setUsername(status.username || 'admin');
        setPasskeyMode(status.hasRegisteredCredentials ? 'sign-in' : 'enroll');
      })
      .catch(() => {
        // Backend unreachable — leave the passkey fallback on the sign-in label; pressing it
        // surfaces a clearer error. Keycloak remains the primary option above.
        if (!cancelled) setPasskeyMode('sign-in');
      });
    return () => {
      cancelled = true;
    };
  }, [ready, isAuthenticated]);

  // Hooks above; conditional render below is rules-of-hooks safe.
  if (!ready) {
    return (
      <Card>
        <Spinner label="Checking your session..." />
      </Card>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/subscriptions" replace />;
  }

  async function handlePasskey() {
    setError(null);
    setSubmitting(true);
    try {
      if (passkeyMode === 'enroll') {
        await passkey.register(username, inferDeviceName());
      }
      await passkey.login(username);
      syncSession();
      navigate('/admin/subscriptions', { replace: true });
    } catch (err) {
      setError(humanize(err instanceof Error ? err.message : 'Sign-in failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  const isEnroll = passkeyMode === 'enroll';

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="text-center animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20">
          <ShieldCheckIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin sign-in</h1>
        <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
          Sign in through Keycloak — your organisation's single sign-on. Password or passkey,
          handled securely by the identity provider.
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <div className="space-y-5">
          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={loginWithKeycloak}
            leadingIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
          >
            Sign in with Keycloak
          </Button>

          <div className="rounded-lg bg-slate-50 dark:bg-midnight-800/50 border border-slate-200 dark:border-midnight-700 px-4 py-3 text-xs text-muted flex gap-2">
            <LockClosedIcon className="h-4 w-4 mt-0.5 flex-none" />
            <span>
              You'll be redirected to Keycloak to authenticate, then returned here. Your credentials
              are never seen by this app.
            </span>
          </div>
        </div>
      </Card>

      {passkeyMode !== 'unsupported' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
            <span className="h-px flex-1 bg-slate-200 dark:bg-midnight-700" />
            or
            <span className="h-px flex-1 bg-slate-200 dark:bg-midnight-700" />
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Device passkey
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Legacy fallback — sign in directly with this device's biometric (Windows Hello,
                  Touch ID, or a security key).
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={submitting}
                onClick={handlePasskey}
                leadingIcon={<FingerPrintIcon className="h-4 w-4" />}
              >
                {isEnroll ? 'Enroll this device' : 'Use a device passkey'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Turn the raw library error strings into something useful. WebAuthn errors are
 * notoriously cryptic when surfaced via DOMException.
 */
function humanize(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('notallowed') || lower.includes('the operation either timed out'))
    return 'The biometric prompt was cancelled or timed out. Please try again.';
  if (lower.includes('invalidstate'))
    return 'This device is already registered. Try signing in instead.';
  if (lower.includes('notsupported'))
    return 'No suitable authenticator was found on this device.';
  if (lower.includes('failed to fetch') || lower.includes('cannot reach'))
    return 'Cannot reach the API. Make sure the backend is running.';
  return message;
}

function inferDeviceName(): string {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows Hello';
  if (/Mac OS X/i.test(ua)) return 'Mac Touch ID';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Face/Touch ID';
  if (/Android/i.test(ua)) return 'Android biometric';
  return 'Platform authenticator';
}
