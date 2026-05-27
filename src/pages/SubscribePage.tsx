import { forwardRef, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserIcon,
  IdentificationIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  HomeModernIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { ApiError, type UpsertSubscriptionAck } from '../lib/types';
import { buildSubscriptionSchema, type SubscriptionFormValues } from '../schemas/subscription';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Card, SectionHeading } from '../components/ui/Card';
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Preferences saved', {
        description: "You'll start receiving newsletters through the channels you picked.",
      });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setServerErrors(err.validationErrors.length ? err.validationErrors : [err.message]);
      } else {
        setServerErrors(['Something went wrong. Please try again.']);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error("We couldn't save your preferences", {
        description: 'Check the highlighted fields and try again.',
      });
    },
  });

  if (lookupsQuery.isLoading) {
    return (
      <Card>
        <Spinner label="Loading subscription options..." />
      </Card>
    );
  }

  if (lookupsQuery.isError) {
    return (
      <Alert tone="error" title="Unable to load form">
        We couldn't load the subscription options. Make sure the API is running, then refresh.
      </Alert>
    );
  }

  const lookups = lookupsQuery.data!;

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <Hero />

      {ack && (
        <Alert tone="success" title="You're all set">
          Your preferences have been recorded. We'll be in touch through the channels you chose.
          <div className="mt-1 text-xs opacity-80">Reference: {ack.correlationId}</div>
        </Alert>
      )}

      {serverErrors.length > 0 && (
        <Alert tone="error" title="We couldn't save your preferences">
          <ul className="list-disc list-inside space-y-0.5">
            {serverErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form
        noValidate
        className="space-y-8 animate-fade-in"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Card className="p-7 sm:p-8">
          <SectionHeading
            icon={<UserIcon className="h-5 w-5" />}
            title="About you"
            description="The basics so we can address you properly."
          />

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
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
              leadingIcon={<EnvelopeIcon className="h-4 w-4 text-slate-400" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <TextInput
              label="Organisation"
              description="Optional — if you're subscribing on behalf of a company."
              autoComplete="organization"
              leadingIcon={<BuildingOfficeIcon className="h-4 w-4 text-slate-400" />}
              error={errors.organisation?.message}
              {...register('organisation')}
            />
          </div>
        </Card>

        <Card className="p-7 sm:p-8">
          <SectionHeading
            icon={<IdentificationIcon className="h-5 w-5" />}
            title="I am a..."
            description="Pick the option that best describes you."
            required
          />
          <Controller
            name="subscriberTypeId"
            control={control}
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {lookups.subscriberTypes.map((type) => {
                  const selected = field.value === type.id;
                  return (
                    <label
                      key={type.id}
                      className={`relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm cursor-pointer transition ${
                        selected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20'
                          : 'border-slate-200 dark:border-midnight-700 hover:border-slate-300 dark:hover:border-midnight-600 hover:bg-slate-50 dark:hover:bg-midnight-800/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={type.id}
                        checked={selected}
                        onChange={() => field.onChange(type.id)}
                        onBlur={field.onBlur}
                        className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {type.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          <FieldError id="subscriberTypeId-error" message={errors.subscriberTypeId?.message} />
        </Card>

        <Card className="p-7 sm:p-8">
          <SectionHeading
            icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
            title="How can we contact you?"
            description="Pick one or more methods. Phone, SMS, and Post each require extra details."
            required
          />
          <Controller
            name="communicationPreferenceIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {lookups.communicationPreferences.map((pref) => {
                  const checked = field.value.includes(pref.id);
                  return (
                    <label
                      key={pref.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm cursor-pointer transition ${
                        checked
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20'
                          : 'border-slate-200 dark:border-midnight-700 hover:border-slate-300 dark:hover:border-midnight-600 hover:bg-slate-50 dark:hover:bg-midnight-800/50'
                      }`}
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
                        className="checkbox-base"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {pref.name}
                      </span>
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

          {phoneOrSmsSelected && (
            <div className="mt-6 animate-fade-in">
              <TextInput
                label="Phone number"
                type="tel"
                autoComplete="tel"
                required
                leadingIcon={<PhoneIcon className="h-4 w-4 text-slate-400" />}
                error={errors.phoneNumber?.message}
                description="Required because you selected Phone or SMS."
                {...register('phoneNumber')}
              />
            </div>
          )}

          {postSelected && (
            <div className="mt-6 animate-fade-in">
              <label
                htmlFor="postalAddress"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Postal address <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-subtle mb-1.5">
                Required because you selected Post.
              </p>
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
        </Card>

        <Card className="p-7 sm:p-8">
          <SectionHeading
            icon={<TagIcon className="h-5 w-5" />}
            title="What would you like to hear about?"
            description="Pick everything that interests you — you can change this any time."
            required
          />
          <Controller
            name="interestIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lookups.interests.map((interest) => {
                  const checked = field.value.includes(interest.id);
                  return (
                    <label
                      key={interest.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm cursor-pointer transition ${
                        checked
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20'
                          : 'border-slate-200 dark:border-midnight-700 hover:border-slate-300 dark:hover:border-midnight-600 hover:bg-slate-50 dark:hover:bg-midnight-800/50'
                      }`}
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
                        className="checkbox-base"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {interest.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          <FieldError id="interestIds-error" message={errors.interestIds?.message as string | undefined} />
        </Card>

        <Card className="p-7 sm:p-8">
          <SectionHeading
            icon={<ShieldCheckIcon className="h-5 w-5" />}
            title="Consent"
            description="We won't send anything without your permission."
            required
          />
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-midnight-700 bg-slate-50 dark:bg-midnight-800/50 px-4 py-4 cursor-pointer">
            <input
              id="consentGiven"
              type="checkbox"
              aria-invalid={!!errors.consentGiven}
              aria-describedby={errors.consentGiven ? 'consentGiven-error' : undefined}
              className="checkbox-base mt-0.5"
              {...register('consentGiven')}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              I consent to receive newsletter communications from SDS / Aspire Software using the
              methods I selected above.
            </span>
          </label>
          <FieldError id="consentGiven-error" message={errors.consentGiven?.message as string | undefined} />
        </Card>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 pt-2">
          <p className="text-xs text-subtle sm:mr-auto">
            By submitting you can unsubscribe at any time via the link in the header.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting || mutation.isPending}
            leadingIcon={<CheckBadgeIcon className="h-4 w-4" />}
          >
            Save preferences
          </Button>
        </div>
      </form>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white px-8 sm:px-12 py-12 sm:py-16 shadow-card-lg">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.4),_transparent_60%)]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-white/20">
          <SparklesIcon className="h-3.5 w-3.5" />
          Newsletter Preferences
        </span>
        <h1 className="mt-5 text-3xl sm:text-4xl font-semibold leading-tight">
          Choose what you hear about — and how.
        </h1>
        <p className="mt-4 text-white/90 max-w-xl text-sm sm:text-base leading-relaxed">
          Tell us who you are, the topics you care about, and the channels you're happy to be
          reached on. You stay in control: update or unsubscribe at any time.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-white/80">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
            <HomeModernIcon className="h-3.5 w-3.5" /> Property updates
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
            Planning &amp; development
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
            Land sourcing
          </span>
        </div>
      </div>
    </section>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, description, error, required, leadingIcon, id, name, ...rest },
  ref,
) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase();
  const errorId = error ? `${inputId}-error` : undefined;
  const descId = description ? `${inputId}-desc` : undefined;
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
      <div className="relative mt-1.5">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
          className={`input-base ${leadingIcon ? 'pl-9' : ''}`}
          {...rest}
        />
      </div>
      <FieldError id={errorId ?? `${inputId}-error`} message={error} />
    </div>
  );
});
