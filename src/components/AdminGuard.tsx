import { Navigate } from 'react-router-dom';
import { adminAuth } from '../lib/auth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const hasKey = !!adminAuth.get();
  if (!hasKey) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
