import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/authContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminGuard } from './components/AdminGuard';
import { AppToaster } from './components/ui/AppToaster';
import { SubscribePage } from './pages/SubscribePage';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminListPage } from './pages/AdminListPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppToaster />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<SubscribePage />} />
                <Route path="unsubscribe" element={<UnsubscribePage />} />
                <Route path="admin" element={<AdminLoginPage />} />
                <Route
                  path="admin/subscriptions"
                  element={
                    <AdminGuard>
                      <AdminListPage />
                    </AdminGuard>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
