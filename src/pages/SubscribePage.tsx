import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { api } from '../lib/api';
import { ApiError } from '../lib/types';
import { buildSubscriptionSchema, type SubscriptionFormValues } from '../schemas/subscription';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Card, SectionHeading } from '../components/ui/Card';
import { FieldError } from '../components/forms/FieldError';

export function SubscribePage() {
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

  const watched = watch();
  const selectedPrefIds = watched.communicationPreferenceIds ?? [];
  const preferences = lookupsQuery.data?.communicationPreferences ?? [];
  const phoneOrSmsSelected = preferences
    .filter((p) => p.code === 'PHONE' || p.code === 'SMS')
    .some((p) => selectedPrefIds.includes(p.id));
  const postSelected = preferences
    .filter((p) => p.code === 'POST')
    .some((p) => selectedPrefIds.includes(p.id));

  const steps = useMemo(() => {
    const aboutComplete = Boolean(
      watched.firstName?.trim() &&
        watched.lastName?.trim() &&
        watched.email?.includes('@') &&
        (watched.subscriberTypeId ?? 0) > 0,
    );
    const contactComplete = Boolean(
      (watched.communicationPreferenceIds?.length ?? 0) > 0 &&
        (!phoneOrSmsSelected || watched.phoneNumber?.trim()) &&
        (!postSelected || watched.postalAddress?.trim()),
    );
    const topicsComplete = (watched.interestIds?.length ?? 0) > 0;
    const consentComplete = watched.consentGiven === true;
    return [
      { label: 'About you', complete: aboutComplete, anchorId: 'step-about' },
      { label: 'Contact', complete: contactComplete, anchorId: 'step-contact' },
      { label: 'Topics', complete: topicsComplete, anchorId: 'step-topics' },
      { label: 'Consent', complete: consentComplete, anchorId: 'step-consent' },
    ];
  }, [watched, phoneOrSmsSelected, postSelected]);

  const firstIncomplete = steps.findIndex((s) => !s.complete);
  const activeStepIndex = firstIncomplete === -1 ? steps.length - 1 : firstIncomplete;
  const completedCount = steps.filter((s) => s.complete).length;

  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [submitVisible, setSubmitVisible] = useState(true);
  useEffect(() => {
    const node = submitButtonRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setSubmitVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -40px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function scrollToAnchor(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
      setServerErrors([]);
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Preferences saved', {
        description: `Ref: ${data.correlationId.slice(0, 8)} — we'll be in touch through your chosen channels.`,
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
      <ProgressStepper steps={steps} activeIndex={activeStepIndex} onNavigate={scrollToAnchor} />

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
        id="subscribe-form"
        noValidate
        className="space-y-8 animate-fade-in"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Card id="step-about" className="p-7 sm:p-8 scroll-mt-24">
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
              description="Already subscribed? Re-submitting with the same email updates your existing preferences."
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

        <Card id="step-contact" className="p-7 sm:p-8 scroll-mt-24">
          <SectionHeading
            icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
            title="How can we contact you?"
            description="Pick one or more methods. Phone, SMS, and Post each require extra details."
            required
            meta={<SelectionCounter selected={selectedPrefIds.length} total={lookups.communicationPreferences.length} />}
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

        <Card id="step-topics" className="p-7 sm:p-8 scroll-mt-24">
          <SectionHeading
            icon={<TagIcon className="h-5 w-5" />}
            title="What would you like to hear about?"
            description="Pick everything that interests you — you can change this any time."
            required
            meta={<SelectionCounter selected={watched.interestIds?.length ?? 0} total={lookups.interests.length} />}
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

        <Card id="step-consent" className="p-7 sm:p-8 scroll-mt-24">
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
            ref={submitButtonRef}
            type="submit"
            size="lg"
            loading={isSubmitting || mutation.isPending}
            leadingIcon={<CheckBadgeIcon className="h-4 w-4" />}
          >
            Save preferences
          </Button>
        </div>
      </form>

      <StickySubmitBar
        visible={!submitVisible}
        completed={completedCount}
        total={steps.length}
        loading={isSubmitting || mutation.isPending}
      />
    </div>
  );
}

interface Step {
  label: string;
  complete: boolean;
  anchorId: string;
}

interface ProgressStepperProps {
  steps: Step[];
  activeIndex: number;
  onNavigate: (anchorId: string) => void;
}

function ProgressStepper({ steps, activeIndex, onNavigate }: ProgressStepperProps) {
  return (
    <section className="animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Newsletter preferences
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tell us how you'd like to hear from us &mdash; you can update or unsubscribe any time.
        </p>
      </div>
      <ol
        aria-label="Form progress"
        className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 dark:border-midnight-700 bg-white/60 dark:bg-midnight-900/40 backdrop-blur px-4 sm:px-5 py-3.5"
      >
        {steps.map((step, i) => {
          const isComplete = step.complete;
          const isActive = i === activeIndex && !isComplete;
          const isLast = i === steps.length - 1;
          return (
            <li key={step.label} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate(step.anchorId)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Go to ${step.label}${isComplete ? ' (completed)' : ''}`}
                className="flex items-center gap-2 min-w-0 rounded-lg px-1.5 py-1 -mx-1.5 -my-1 hover:bg-slate-100/70 dark:hover:bg-midnight-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition"
              >
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isComplete
                      ? 'bg-brand-600 text-white shadow-sm'
                      : isActive
                        ? 'bg-white dark:bg-midnight-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500'
                        : 'bg-slate-100 dark:bg-midnight-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isComplete ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`hidden sm:inline text-sm font-medium truncate ${
                    isComplete || isActive
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <div
                  className={`h-px flex-1 min-w-[12px] transition-colors ${
                    isComplete ? 'bg-brand-500/60' : 'bg-slate-200 dark:bg-midnight-700'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

interface SelectionCounterProps {
  selected: number;
  total: number;
}

function SelectionCounter({ selected, total }: SelectionCounterProps) {
  const active = selected > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition ${
        active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 ring-1 ring-brand-500/20'
          : 'bg-slate-100 dark:bg-midnight-800 text-slate-500 dark:text-slate-400'
      }`}
      aria-live="polite"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-brand-500' : 'bg-slate-400 dark:bg-slate-600'}`}
        aria-hidden="true"
      />
      {selected} of {total} selected
    </span>
  );
}

interface StickySubmitBarProps {
  visible: boolean;
  completed: number;
  total: number;
  loading: boolean;
}

function StickySubmitBar({ visible, completed, total, loading }: StickySubmitBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-200 ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="border-t border-slate-200 dark:border-midnight-700 bg-white/90 dark:bg-midnight-950/90 backdrop-blur shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-5 sm:px-8 py-3">
          <span className="text-xs sm:text-sm text-muted tabular-nums">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{completed}</span>{' '}
            of {total} steps complete
          </span>
          <Button
            type="submit"
            form="subscribe-form"
            size="md"
            loading={loading}
            leadingIcon={<CheckBadgeIcon className="h-4 w-4" />}
          >
            Save preferences
          </Button>
        </div>
      </div>
    </div>
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
