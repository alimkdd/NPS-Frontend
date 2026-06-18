import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuth();

  // Wait for Keycloak's silent SSO check before deciding, otherwise we'd bounce an
  // authenticated admin back to /admin during the (brief) init.
  if (!ready) {
    return (
      <Card>
        <Spinner label="Checking your session..." />
      </Card>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
