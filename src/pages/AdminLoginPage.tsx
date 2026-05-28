import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  FingerPrintIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { passkey } from '../lib/passkey';
import { adminSession } from '../lib/session';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

type Mode = 'loading' | 'sign-in' | 'enroll' | 'unsupported';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('loading');
  const [username, setUsername] = useState('admin');
  const [displayName, setDisplayName] = useState('Administrator');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captured once per render so the early-return below + the useEffect see
  // the same value. The session can only flip false→true via the login flow
  // (which navigates away on success), so capturing once is safe.
  const alreadyAuthenticated = adminSession.isAuthenticated();

  useEffect(() => {
    if (alreadyAuthenticated) return; // valid session — about to redirect, skip the status fetch
    if (!passkey.isSupported()) {
      setMode('unsupported');
      return;
    }
    let cancelled = false;
    passkey
      .getStatus()
      .then((status) => {
        if (cancelled) return;
        setUsername(status.username || 'admin');
        setDisplayName(status.displayName || 'Administrator');
        setMode(status.hasRegisteredCredentials ? 'sign-in' : 'enroll');
      })
      .catch(() => {
        if (cancelled) return;
        setError('Cannot reach the API. Make sure the backend is running.');
        setMode('sign-in'); // fall through; the sign-in button surface a clearer error if pressed
      });
    return () => {
      cancelled = true;
    };
  }, [alreadyAuthenticated]);

  // Hooks declared above; conditional render below is rules-of-hooks safe.
  if (alreadyAuthenticated) {
    return <Navigate to="/admin/subscriptions" replace />;
  }

  async function handleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await passkey.login(username);
      navigate('/admin/subscriptions', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      setError(humanize(message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnroll() {
    setError(null);
    setSubmitting(true);
    try {
      const deviceName = inferDeviceName();
      await passkey.register(username, deviceName);
      // Auto-sign-in straight after enrollment so the admin lands in the dashboard.
      await passkey.login(username);
      navigate('/admin/subscriptions', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrollment failed.';
      setError(humanize(message));
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === 'loading') {
    return (
      <Card>
        <Spinner label="Checking admin auth state..." />
      </Card>
    );
  }

  if (mode === 'unsupported') {
    return (
      <div className="max-w-md mx-auto">
        <Alert tone="error" title="Biometrics not available">
          This browser doesn't support WebAuthn. Try the latest Chrome, Edge, Firefox, or Safari over
          HTTPS (or http://localhost during local dev).
        </Alert>
      </div>
    );
  }

  const isEnroll = mode === 'enroll';

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="text-center animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20">
          {isEnroll ? (
            <SparklesIcon className="h-6 w-6" />
          ) : (
            <FingerPrintIcon className="h-6 w-6" />
          )}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {isEnroll ? 'Set up biometric sign-in' : 'Admin sign-in'}
        </h1>
        <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
          {isEnroll
            ? 'No passkey has been registered yet for this admin. Enroll your device — Windows Hello, Touch ID, or a security key — to sign in without a password.'
            : `Sign in as ${displayName} using your registered biometric.`}
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Admin user
            </label>
            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 font-medium">
              {displayName} <span className="text-subtle font-normal">({username})</span>
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            fullWidth
            loading={submitting}
            onClick={isEnroll ? handleEnroll : handleSignIn}
            leadingIcon={
              isEnroll ? <ShieldCheckIcon className="h-4 w-4" /> : <FingerPrintIcon className="h-4 w-4" />
            }
          >
            {isEnroll ? 'Enroll this device' : 'Sign in with biometrics'}
          </Button>

          <div className="rounded-lg bg-slate-50 dark:bg-midnight-800/50 border border-slate-200 dark:border-midnight-700 px-4 py-3 text-xs text-muted flex gap-2">
            <LockClosedIcon className="h-4 w-4 mt-0.5 flex-none" />
            <span>
              Your fingerprint/face never leaves this device. The browser proves your identity with a
              cryptographic signature; the server only stores the public half of the key.
            </span>
          </div>
        </div>
      </Card>
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
