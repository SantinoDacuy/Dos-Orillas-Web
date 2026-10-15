export type ContactField = 'name' | 'email' | 'organization' | 'message';
export type ContactErrors = Partial<Record<ContactField, string>>;
export interface ContactSubmission {
  name: string;
  email: string;
  organization: string;
  message: string;
  website: string;
  requestId?: string;
}
export type ContactValidation = { success: true; data: ContactSubmission } | { success: false; errors: ContactErrors };
export type ContactResponseCode = 'sent' | 'invalid' | 'discarded' | 'unavailable' | 'timeout' | 'body_timeout' | 'rate_limited' | 'too_large' | 'unsupported' | 'forbidden';
export interface ContactResponse { ok: boolean; code: ContactResponseCode; errors?: ContactErrors }
