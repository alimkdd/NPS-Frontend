import type { ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  tone: Tone;
  title?: string;
  children?: ReactNode;
}

const toneStyles: Record<Tone, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-brand-50 border-brand-100 text-brand-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

export function Alert({ tone, title, children }: AlertProps) {
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 ${toneStyles[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={`text-sm ${title ? 'mt-1' : ''}`}>{children}</div>}
    </div>
  );
}
