import { forwardRef, useMemo, useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import type { Country, Value } from 'react-phone-number-input';
import { getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import 'react-phone-number-input/style.css';
import { FieldError } from './FieldError';

interface PhoneNumberFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  description?: string;
  defaultCountry?: Country;
}

// react-phone-number-input renders this as the text portion of the field. We forward
// the ref and spread its props so formatting/validation keep working, and only swap in
// our own styling (the wrapper carries the border/focus ring, so this stays borderless).
const PhoneTextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PhoneTextInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-midnight-400 focus:outline-none focus:ring-0"
      />
    );
  },
);

export function PhoneNumberField({
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  description,
  defaultCountry = 'GB',
}: PhoneNumberFieldProps) {
  const [country, setCountry] = useState<Country | undefined>(defaultCountry);

  const exampleHint = useMemo(() => {
    if (!country) return null;
    try {
      const example = getExampleNumber(country, examples);
      if (!example) return null;
      return `e.g. ${example.formatInternational()}`;
    } catch {
      return null;
    }
  }, [country]);

  const inputId = 'phoneNumber';
  const errorId = error ? `${inputId}-error` : undefined;
  const descId = description ? `${inputId}-desc` : undefined;
  const hintId = exampleHint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && (
        <p id={descId} className="text-xs text-subtle mb-1.5">
          {description}
        </p>
      )}
      <div
        className={`phone-field mt-1.5 flex items-center gap-2 rounded-lg border bg-white dark:bg-midnight-900 px-3.5 py-2.5 shadow-sm transition-colors duration-150 focus-within:ring-1 ${
          error
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500'
            : 'border-slate-300 dark:border-midnight-700 focus-within:border-brand-500 focus-within:ring-brand-500'
        }`}
      >
        <PhoneInput
          id={inputId}
          international
          defaultCountry={defaultCountry}
          value={value as Value | undefined}
          onChange={(v) => onChange(v as string | undefined)}
          onBlur={onBlur}
          onCountryChange={(c) => setCountry(c ?? defaultCountry)}
          inputComponent={PhoneTextInput}
          aria-invalid={!!error}
          aria-describedby={[descId, hintId, errorId].filter(Boolean).join(' ') || undefined}
        />
      </div>
      {exampleHint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-subtle tabular-nums">
          {exampleHint}
        </p>
      )}
      <FieldError id={errorId ?? `${inputId}-error`} message={error} />
    </div>
  );
}
