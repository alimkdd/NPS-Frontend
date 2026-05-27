import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { adminAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    adminAuth.set(key);
    try {
      const probe = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5289'}/api/admin/subscriptions?pageSize=1`,
        { headers: { 'X-Admin-Key': key } },
      );
      if (probe.status === 401) {
        adminAuth.clear();
        setError('That admin key was rejected.');
        return;
      }
      if (!probe.ok && probe.status !== 200) {
        setError(`Unexpected response (${probe.status}). Is the API reachable?`);
        return;
      }
      navigate('/admin/subscriptions', { replace: true });
    } catch {
      adminAuth.clear();
      setError('Cannot reach the API. Make sure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="text-center animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20">
          <LockClosedIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Admin sign-in
        </h1>
        <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
          Enter the admin API key to access the subscriptions dashboard.
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <form noValidate className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="adminKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Admin key <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <KeyIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input
                id="adminKey"
                type="password"
                autoComplete="off"
                className="input-base pl-9"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!key.trim()}
            trailingIcon={<ArrowRightIcon className="h-4 w-4" />}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-5 rounded-lg bg-slate-50 dark:bg-midnight-800/50 border border-slate-200 dark:border-midnight-700 px-4 py-3 text-xs text-muted">
          Your key is kept in this browser tab only (sessionStorage) and sent as the{' '}
          <code className="rounded bg-slate-200 dark:bg-midnight-700 px-1 py-0.5 text-[11px]">X-Admin-Key</code>{' '}
          header on every admin request. The server compares a SHA-256 hash of it in constant
          time.
        </div>
      </Card>
    </div>
  );
}
