import { type ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

type Tone = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  tone: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper:
      'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
    icon: <CheckCircleIcon className="h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />,
  },
  error: {
    wrapper:
      'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-200',
    icon: <ExclamationCircleIcon className="h-5 w-5 flex-none text-red-600 dark:text-red-400" />,
  },
  info: {
    wrapper:
      'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 text-brand-900 dark:text-brand-200',
    icon: <InformationCircleIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />,
  },
  warning: {
    wrapper:
      'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200',
    icon: <ExclamationTriangleIcon className="h-5 w-5 flex-none text-amber-600 dark:text-amber-400" />,
  },
};

export function Alert({ tone, title, children, className = '' }: AlertProps) {
  const { wrapper, icon } = toneStyles[tone];
  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border px-4 py-3 animate-fade-in ${wrapper} ${className}`}
    >
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={`text-sm ${title ? 'mt-1' : ''}`}>{children}</div>}
      </div>
    </div>
  );
}
