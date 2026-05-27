import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  EnvelopeOpenIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/85 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Newsletter Preferences
              </span>
              <span className="text-[10px] uppercase tracking-wider text-subtle">
                SDS · Aspire
              </span>
            </div>
          </NavLink>

          <nav aria-label="Primary" className="hidden sm:flex items-center gap-1 ml-6">
            <NavItem to="/" icon={<EnvelopeOpenIcon className="h-4 w-4" />}>
              Subscribe
            </NavItem>
            <NavItem to="/unsubscribe" icon={<HandRaisedIcon className="h-4 w-4" />}>
              Unsubscribe
            </NavItem>
            <NavItem
              to={isAdmin ? '/admin/subscriptions' : '/admin'}
              icon={<Cog6ToothIcon className="h-4 w-4" />}
              matchPrefix="/admin"
            >
              Admin
            </NavItem>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Primary mobile" className="sm:hidden border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex gap-1 overflow-x-auto">
          <NavItem to="/" icon={<EnvelopeOpenIcon className="h-4 w-4" />}>
            Subscribe
          </NavItem>
          <NavItem to="/unsubscribe" icon={<HandRaisedIcon className="h-4 w-4" />}>
            Unsubscribe
          </NavItem>
          <NavItem
            to={isAdmin ? '/admin/subscriptions' : '/admin'}
            icon={<Cog6ToothIcon className="h-4 w-4" />}
            matchPrefix="/admin"
          >
            Admin
          </NavItem>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 surface-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
            Newsletter Preference System — recruitment exercise
          </span>
          <span>Built with .NET 10 · React · Tailwind</span>
        </div>
      </footer>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  matchPrefix?: string;
}

function NavItem({ to, icon, children, matchPrefix }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={!matchPrefix}
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
