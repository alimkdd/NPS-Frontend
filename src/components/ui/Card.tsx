import { type HTMLAttributes, type ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  padded?: boolean;
}

export function Card({
  variant = 'default',
  padded = true,
  className = '',
  children,
  ...rest
}: CardProps) {
  const base = variant === 'elevated' ? 'card-elevated' : 'card';
  return (
    <div className={`${base} ${padded ? 'p-6' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

interface SectionHeadingProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  required?: boolean;
  meta?: ReactNode;
}

export function SectionHeading({ icon, title, description, required, meta }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      {icon && (
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title} {required && <span className="text-red-500">*</span>}
          </h2>
          {meta}
        </div>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
