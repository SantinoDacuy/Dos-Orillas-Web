import { z } from 'zod';
import { contactFeedback } from '@/content/contact-feedback';
import { contactLimits } from './limits';
import type { ContactErrors, ContactField, ContactValidation } from './types';

const singleLine = (value: string): boolean => !Array.from(value).some(character => {
  const code = character.codePointAt(0) ?? 0;
  return code < 32 || code === 127;
});
export const contactEmailSchema = z.string({ error: contactFeedback.validations.email }).trim()
  .max(contactLimits.email, { error: contactFeedback.validations.email }).pipe(z.email({ error: contactFeedback.validations.email }));
export const contactSchema = z.strictObject({
  name: z.string({ error: contactFeedback.validations.name }).trim().min(1, { error: contactFeedback.validations.name })
    .max(contactLimits.name, { error: contactFeedback.validations.nameTooLong }).refine(singleLine, { error: contactFeedback.validations.invalidText }),
  email: contactEmailSchema,
  organization: z.string({ error: contactFeedback.validations.organization }).trim()
    .max(contactLimits.organization, { error: contactFeedback.validations.organizationTooLong }).refine(singleLine, { error: contactFeedback.validations.invalidText }).default(''),
  message: z.string({ error: contactFeedback.validations.message }).trim().min(1, { error: contactFeedback.validations.message })
    .max(contactLimits.message, { error: contactFeedback.validations.messageTooLong })
    .refine(value => !Array.from(value).some(character => {
      const code = character.codePointAt(0) ?? 0;
      return code < 32 && code !== 9 && code !== 10 && code !== 13 || code === 127;
    }), { error: contactFeedback.validations.invalidText }),
  website: z.string().max(200).default(''),
  requestId: z.uuid().optional(),
});

export function validateContact(input: unknown): ContactValidation {
  const result = contactSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  const errors: ContactErrors = {};
  const fields: readonly ContactField[] = ['name', 'email', 'organization', 'message'];
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && fields.includes(field as ContactField) && !errors[field as ContactField]) {
      errors[field as ContactField] = issue.message;
    }
  }
  return { success: false, errors };
}
