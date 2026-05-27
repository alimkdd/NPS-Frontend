import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400 animate-fade-in">
      <ExclamationCircleIcon className="h-4 w-4 flex-none" aria-hidden="true" />
      {message}
    </p>
  );
}
