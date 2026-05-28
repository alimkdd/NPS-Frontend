import { Navigate } from 'react-router-dom';
import { adminSession } from '../lib/session';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!adminSession.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
