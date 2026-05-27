import { forwardRef, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ApiError, type UpsertSubscriptionAck } from '../lib/types';
import { buildSubscriptionSchema, type SubscriptionFormValues } from '../schemas/subscription';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { FieldError } from '../components/forms/FieldError';

export function SubscribePage() {
  const [ack, setAck] = useState<UpsertSubscriptionAck | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const lookupsQuery = useQuery({
    queryKey: ['lookups'],
    queryFn: ({ signal }) => api.getLookups(signal),
  });

  const schema = useMemo(
    () => buildSubscriptionSchema(lookupsQuery.data?.communicationPreferences ?? []),
    [lookupsQuery.data?.communicationPreferences],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organisation: '',
      subscriberTypeId: 0,
      communicationPreferenceIds: [],
      interestIds: [],
      phoneNumber: '',
      postalAddress: '',
      consentGiven: false,
    },
    mode: 'onBlur',
  });

  const selectedPrefIds = watch('communicationPreferenceIds') ?? [];
  const preferences = lookupsQuery.data?.communicationPreferences ?? [];
  const phoneOrSmsSelected = preferences
    .filter((p) => p.code === 'PHONE' || p.code === 'SMS')
    .some((p) => selectedPrefIds.includes(p.id));
  const postSelected = preferences
    .filter((p) => p.code === 'POST')
    .some((p) => selectedPrefIds.includes(p.id));

  const mutation = useMutation({
    mutationFn: (values: SubscriptionFormValues) =>
      api.upsertSubscription({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        organisation: values.organisation?.trim() || null,
        subscriberTypeId: values.subscriberTypeId,
        communicationPreferenceIds: values.communicationPreferenceIds,
        interestIds: values.interestIds,
        phoneNumber: values.phoneNumber?.trim() || null,
        postalAddress: values.postalAddress?.trim() || null,
        consentGiven: values.consentGiven,
      }),
    onSuccess: (data) => {
      setAck(data);
      setServerErrors([]);
      reset();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setServerErrors(err.validationErrors.length ? err.validationErrors : [err.message]);
      } else {
        setServerErrors(['Something went wrong. Please try again.']);
      }
    },
  });

  if (lookupsQuery.isLoading) {
    return <Spinner label="Loading subscription options…" />;
  }

  if (lookupsQuery.isError) {
    return (
      <Alert tone="error" title="Unable to load form">
        We couldn’t load the subscription options. Make sure the API is running, then refresh.
      </Alert>
    );
  }

  const lookups = lookupsQuery.data!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Newsletter preferences</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell us who you are, what you’re interested in, and how you’d like to hear from us.
        </p>
      </header>

      {ack && (
        <Alert tone="success" title="Preferences saved">
          Thank you — your preferences have been recorded.
          <div className="mt-1 text-xs opacity-80">Reference: {ack.correlationId}</div>
        </Alert>
      )}

      {serverErrors.length > 0 && (
        <Alert tone="error" title="We couldn’t save your preferences">
          <ul className="list-disc list-inside space-y-0.5">
            {serverErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form
        noValidate
        className="space-y-6 bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <section aria-labelledby="about-you" className="space-y-4">
          <h2 id="about-you" className="text-base font-semibold text-slate-900">
            About you
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="First name"
              autoComplete="given-name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextInput
              label="Last name"
              autoComplete="family-name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <TextInput
            label="Email address"
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <TextInput
            label="Organisation"
            description="Optional"
            autoComplete="organization"
            error={errors.organisation?.message}
            {...register('organisation')}
          />
        </section>

        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-slate-900">
            I am a… <span className="text-red-600">*</span>
          </legend>
          <Controller
            name="subscriberTypeId"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {lookups.subscriberTypes.map((type) => (
                  <label
                    key={type.id}
                    className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={type.id}
                      checked={field.value === type.id}
                      onChange={() => field.onChange(type.id)}
                      onBlur={field.onBlur}
                      className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                    />
                    {type.name}
                  </label>
                ))}
              </div>
            )}
          />
          <FieldError id="subscriberTypeId-error" message={errors.subscriberTypeId?.message} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-slate-900">
            How can we contact you? <span className="text-red-600">*</span>
          </legend>
          <p className="text-sm text-slate-600">Pick one or more options.</p>
          <Controller
            name="communicationPreferenceIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {lookups.communicationPreferences.map((pref) => {
                  const checked = field.value.includes(pref.id);
                  return (
                    <label
                      key={pref.id}
                      className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...field.value, pref.id]
                            : field.value.filter((id) => id !== pref.id);
                          field.onChange(next);
                        }}
                        onBlur={field.onBlur}
                        className="h-4 w-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                      />
                      {pref.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
          <FieldError
            id="communicationPreferenceIds-error"
            message={errors.communicationPreferenceIds?.message as string | undefined}
          />
        </fieldset>

        {phoneOrSmsSelected && (
          <TextInput
            label="Phone number"
            type="tel"
            autoComplete="tel"
            required
            error={errors.phoneNumber?.message}
            description="Required because you selected Phone or SMS."
            {...register('phoneNumber')}
          />
        )}

        {postSelected && (
          <div>
            <label
              htmlFor="postalAddress"
              className="block text-sm font-medium text-slate-700"
            >
              Postal address <span className="text-red-600">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-1">Required because you selected Post.</p>
            <textarea
              id="postalAddress"
              rows={3}
              aria-invalid={!!errors.postalAddress}
              aria-describedby={errors.postalAddress ? 'postalAddress-error' : undefined}
              className="input-base"
              {...register('postalAddress')}
            />
            <FieldError id="postalAddress-error" message={errors.postalAddress?.message} />
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-slate-900">
            What would you like to hear about? <span className="text-red-600">*</span>
          </legend>
          <Controller
            name="interestIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {lookups.interests.map((interest) => {
                  const checked = field.value.includes(interest.id);
                  return (
                    <label
                      key={interest.id}
                      className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...field.value, interest.id]
                            : field.value.filter((id) => id !== interest.id);
                          field.onChange(next);
                        }}
                        onBlur={field.onBlur}
                        className="h-4 w-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                      />
                      {interest.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
          <FieldError id="interestIds-error" message={errors.interestIds?.message as string | undefined} />
        </fieldset>

        <div className="flex items-start gap-3 rounded-md bg-slate-50 border border-slate-200 px-4 py-3">
          <input
            id="consentGiven"
            type="checkbox"
            aria-invalid={!!errors.consentGiven}
            aria-describedby={errors.consentGiven ? 'consentGiven-error' : undefined}
            className="mt-0.5 h-4 w-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
            {...register('consentGiven')}
          />
          <label htmlFor="consentGiven" className="text-sm text-slate-700">
            I consent to receive newsletter communications from SDS / Aspire Software
            using the methods I selected above. <span className="text-red-600">*</span>
          </label>
        </div>
        <FieldError id="consentGiven-error" message={errors.consentGiven?.message as string | undefined} />

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Save preferences
          </Button>
        </div>
      </form>
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, description, error, required, id, name, ...rest },
  ref,
) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase();
  const errorId = error ? `${inputId}-error` : undefined;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {description && (
        <p id={descId} className="text-xs text-slate-500 mb-1">
          {description}
        </p>
      )}
      <input
        id={inputId}
        name={name}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
        className="input-base"
        {...rest}
      />
      <FieldError id={errorId ?? `${inputId}-error`} message={error} />
    </div>
  );
});
