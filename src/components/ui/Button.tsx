import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-900 disabled:bg-brand-600/50',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-600/50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 disabled:opacity-60',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, disabled, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  );
});
