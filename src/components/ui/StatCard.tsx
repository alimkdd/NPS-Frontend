import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  loading?: boolean;
  accent?: 'brand' | 'emerald' | 'amber';
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

export function StatCard({ icon, label, value, hint, loading, accent = 'brand' }: StatCardProps) {
  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentStyles[accent]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 rounded bg-slate-200 dark:bg-midnight-800 animate-pulse-soft" />
        ) : (
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
        )}
        {hint && !loading && <p className="text-xs text-subtle mt-1.5">{hint}</p>}
      </div>
    </div>
  );
}
