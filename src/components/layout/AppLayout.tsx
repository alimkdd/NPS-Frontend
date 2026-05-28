import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  EnvelopeOpenIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import { NewspaperIcon } from '@heroicons/react/24/solid';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/85 dark:bg-midnight-950/85 border-b border-slate-200 dark:border-midnight-700">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center gap-5">
          <NavLink to="/" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <NewspaperIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Newsletter Preferences
              </span>
              <span className="text-[10px] uppercase tracking-wider text-subtle">
                SDS &middot; Aspire
              </span>
            </div>
          </NavLink>

          <nav aria-label="Primary" className="hidden sm:flex items-center gap-1 ml-8">
            <NavItem to="/" icon={<EnvelopeOpenIcon className="h-5 w-5" />}>
              Subscribe
            </NavItem>
            <NavItem to="/unsubscribe" icon={<HandRaisedIcon className="h-5 w-5" />}>
              Unsubscribe
            </NavItem>
            <NavItem
              to={isAdmin ? '/admin/subscriptions' : '/admin'}
              icon={<Cog6ToothIcon className="h-5 w-5" />}
              matchPrefix="/admin"
            >
              Admin
            </NavItem>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        <nav
          aria-label="Primary mobile"
          className="sm:hidden border-t border-slate-200 dark:border-midnight-700 px-3 py-2 flex gap-1 overflow-x-auto"
        >
          <NavItem to="/" icon={<EnvelopeOpenIcon className="h-5 w-5" />}>
            Subscribe
          </NavItem>
          <NavItem to="/unsubscribe" icon={<HandRaisedIcon className="h-5 w-5" />}>
            Unsubscribe
          </NavItem>
          <NavItem
            to={isAdmin ? '/admin/subscriptions' : '/admin'}
            icon={<Cog6ToothIcon className="h-5 w-5" />}
            matchPrefix="/admin"
          >
            Admin
          </NavItem>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-midnight-700 surface-muted">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
            Newsletter Preference System &middot; recruitment exercise
          </span>
          <span>Built with .NET 10 &middot; React &middot; Tailwind</span>
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
        `inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-base font-medium transition ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-midnight-800'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
