import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-slate-600">The page you were looking for doesn’t exist.</p>
      <Link to="/" className="text-brand-700 underline">
        Go home
      </Link>
    </div>
  );
}
