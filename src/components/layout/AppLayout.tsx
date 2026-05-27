import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            Newsletter Preferences
          </NavLink>
          <nav aria-label="Primary" className="flex gap-4 text-sm">
            <NavItem to="/">Subscribe</NavItem>
            <NavItem to="/unsubscribe">Unsubscribe</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-slate-500">
          Newsletter Preference System — recruitment exercise
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded px-2 py-1 ${
          isActive
            ? 'text-brand-700 font-medium'
            : 'text-slate-600 hover:text-slate-900'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
