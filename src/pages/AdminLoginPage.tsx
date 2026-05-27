import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Probe the admin endpoint with this key — if we get 401, the key is wrong.
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
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin sign-in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the admin API key to access the subscriptions dashboard. Your key is kept in
          this browser tab only (sessionStorage) and is sent as the <code>X-Admin-Key</code>{' '}
          header on every admin request.
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <form
        noValidate
        className="space-y-4 bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="adminKey" className="block text-sm font-medium text-slate-700">
            Admin key <span className="text-red-600">*</span>
          </label>
          <input
            id="adminKey"
            type="password"
            autoComplete="off"
            className="input-base mt-1"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </div>

        <Button type="submit" loading={submitting} disabled={!key.trim()}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
