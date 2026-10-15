import { contactCopy } from '@/content/site';
import { contactFeedback } from '@/content/contact-feedback';
import { contactLimits } from './limits';
import { validateContact } from './schema';
import type { ContactErrors, ContactField, ContactResponse, ContactSubmission } from './types';

/** This module, including validation, loads only after form focus or submit. */
export interface ContactClientSession {
  alive: boolean;
  busy: boolean;
  requestId?: string;
  controller: AbortController | null;
}
type SubmitResult = { status: 'success' } | { status: 'error'; errors: ContactErrors; notice: string };
const fields: readonly ContactField[] = ['name', 'email', 'organization', 'message'];

function responseNotice(code: ContactResponse['code']): string {
  if (code === 'timeout') return contactFeedback.uncertain;
  if (code === 'body_timeout') return contactFeedback.bodyTimeout;
  if (code === 'rate_limited') return contactFeedback.rateLimited;
  if (code === 'too_large') return contactFeedback.tooLarge;
  if (code === 'invalid' || code === 'discarded' || code === 'unsupported' || code === 'forbidden') return contactFeedback.invalidRequest;
  return contactFeedback.unavailable;
}

export async function submitContact(values: FormData, session: ContactClientSession): Promise<SubmitResult | undefined> {
  if (!session.alive) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  try {
    session.requestId ??= typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined;
    const input: ContactSubmission = {
      name: String(values.get('name') ?? ''), email: String(values.get('email') ?? ''),
      organization: String(values.get('organization') ?? ''), message: String(values.get('message') ?? ''),
      website: String(values.get('website') ?? ''), requestId: session.requestId,
    };
    const parsed = validateContact(input);
    if (!parsed.success) return { status: 'error', errors: parsed.errors, notice: contactCopy.errors.summary };
    controller = new AbortController(); session.controller = controller;
    timer = setTimeout(() => controller?.abort(), contactLimits.clientTimeoutMs);
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data), signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
    const payload: ContactResponse = await response.json();
    if (!session.alive) return;
    if (response.ok && payload.ok === true && payload.code === 'sent') return { status: 'success' };
    const errors: ContactErrors = {};
    for (const field of fields) if (typeof payload.errors?.[field] === 'string') errors[field] = payload.errors[field];
    return { status: 'error', errors, notice: responseNotice(payload.code) };
  } catch {
    if (session.alive) return { status: 'error', errors: {},
      notice: controller?.signal.aborted ? contactFeedback.uncertain : contactCopy.errors.network };
  } finally {
    if (timer) clearTimeout(timer);
    if (session.controller === controller) session.controller = null;
  }
}
