import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { LookupItem } from '../lib/types';

// Tighter than FluentValidation's lenient EmailAddress() — mirrors the backend's
// stricter Email value object regex.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export const buildSubscriptionSchema = (preferences: LookupItem[]) => {
  const phoneCode = preferences.find((p) => p.code === 'PHONE')?.id;
  const smsCode = preferences.find((p) => p.code === 'SMS')?.id;
  const postCode = preferences.find((p) => p.code === 'POST')?.id;

  return z
    .object({
      firstName: z
        .string()
        .trim()
        .min(1, 'First name is required.')
        .max(100, 'First name must be 100 characters or fewer.'),
      lastName: z
        .string()
        .trim()
        .min(1, 'Last name is required.')
        .max(100, 'Last name must be 100 characters or fewer.'),
      email: z
        .string()
        .trim()
        .min(1, 'Email address is required.')
        .max(255, 'Email must be 255 characters or fewer.')
        .regex(emailRegex, 'Enter a valid email address.'),
      organisation: z
        .string()
        .trim()
        .max(255, 'Organisation must be 255 characters or fewer.')
        .optional()
        .or(z.literal('')),
      subscriberTypeId: z
        .number()
        .int()
        .min(1, 'Please select a subscriber type.'),
      communicationPreferenceIds: z
        .array(z.number().int())
        .min(1, 'Choose at least one communication preference.'),
      interestIds: z
        .array(z.number().int())
        .min(1, 'Choose at least one newsletter interest.'),
      phoneNumber: z
        .string()
        .trim()
        .max(30, 'Phone number must be 30 characters or fewer.')
        .optional()
        .or(z.literal('')),
      postalAddress: z
        .string()
        .trim()
        .max(500, 'Postal address must be 500 characters or fewer.')
        .optional()
        .or(z.literal('')),
      consentGiven: z.boolean().refine((v) => v === true, {
        message: 'You must consent to receive communications.',
      }),
    })
    .superRefine((data, ctx) => {
      const ids = new Set(data.communicationPreferenceIds);
      const needsPhone =
        (phoneCode !== undefined && ids.has(phoneCode)) ||
        (smsCode !== undefined && ids.has(smsCode));
      const needsPostal = postCode !== undefined && ids.has(postCode);

      const phone = data.phoneNumber?.trim();
      if (needsPhone && !phone) {
        ctx.addIssue({
          code: 'custom',
          path: ['phoneNumber'],
          message: 'Phone number is required when Phone or SMS is selected.',
        });
      } else if (phone && !isValidPhoneNumber(phone)) {
        ctx.addIssue({
          code: 'custom',
          path: ['phoneNumber'],
          message: 'Enter a valid phone number for the selected country.',
        });
      }

      if (needsPostal && !data.postalAddress?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['postalAddress'],
          message: 'Postal address is required when Post is selected.',
        });
      }
    });
};

export type SubscriptionFormValues = z.infer<ReturnType<typeof buildSubscriptionSchema>>;

export const unsubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .regex(emailRegex, 'Enter a valid email address.'),
});

export type UnsubscribeFormValues = z.infer<typeof unsubscribeSchema>;
