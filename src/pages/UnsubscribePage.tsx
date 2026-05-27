import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ApiError } from '../lib/types';
import { unsubscribeSchema, type UnsubscribeFormValues } from '../schemas/subscription';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { FieldError } from '../components/forms/FieldError';

export function UnsubscribePage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UnsubscribeFormValues>({
    resolver: zodResolver(unsubscribeSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (values: UnsubscribeFormValues) => api.unsubscribe(values.email.trim()),
    onSuccess: () => {
      setSuccess(true);
      setServerError(null);
      reset();
    },
    onError: (err) => {
      setSuccess(false);
      setServerError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    },
  });

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Unsubscribe</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the email address you subscribed with. If we have a record for it, your
          preferences will be removed.
        </p>
      </header>

      {success && (
        <Alert tone="success" title="Request received">
          If a matching subscription exists, it has been removed.
        </Alert>
      )}

      {serverError && (
        <Alert tone="error" title="We couldn’t process your request">
          {serverError}
        </Alert>
      )}

      <form
        noValidate
        className="space-y-4 bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="input-base mt-1"
            {...register('email')}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="danger" loading={isSubmitting || mutation.isPending}>
            Unsubscribe
          </Button>
        </div>
      </form>
    </div>
  );
}
