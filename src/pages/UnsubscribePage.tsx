import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HandRaisedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { ApiError } from '../lib/types';
import { unsubscribeSchema, type UnsubscribeFormValues } from '../schemas/subscription';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
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
      toast.success('Unsubscribed', {
        description: 'If we had a record for that email, it has been removed.',
      });
    },
    onError: (err) => {
      setSuccess(false);
      setServerError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
      toast.error('Couldn’t process your request');
    },
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header className="text-center animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md ring-1 ring-white/20">
          <HandRaisedIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Unsubscribe
        </h1>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          Enter the email address you subscribed with. If we have a record for it, your
          preferences will be removed — no questions asked.
        </p>
      </header>

      {success && (
        <Alert tone="success" title="Request received">
          If a matching subscription exists, it has been removed. You won’t hear from us again
          unless you re-subscribe.
        </Alert>
      )}

      {serverError && (
        <Alert tone="error" title="We couldn’t process your request">
          {serverError}
        </Alert>
      )}

      <Card>
        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="input-base pl-9"
                {...register('email')}
              />
            </div>
            <FieldError id="email-error" message={errors.email?.message} />
          </div>

          <Button
            type="submit"
            variant="danger"
            size="lg"
            fullWidth
            loading={isSubmitting || mutation.isPending}
          >
            Unsubscribe
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-subtle">
        Changed your mind? <a href="/" className="text-brand-600 dark:text-brand-400 hover:underline">Subscribe again</a>.
      </p>
    </div>
  );
}
