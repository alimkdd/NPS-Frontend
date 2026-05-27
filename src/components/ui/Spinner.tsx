interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

export function Spinner({ label = 'Loading…', size = 'md', inline = false }: SpinnerProps) {
  return (
    <div
      className={`flex items-center gap-2 text-muted ${inline ? '' : 'py-8 justify-center'}`}
      role="status"
      aria-live="polite"
    >
      <svg className={`${sizes[size]} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}
