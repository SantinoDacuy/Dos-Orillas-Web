import 'server-only';
import { randomUUID } from 'node:crypto';
import { contactCopy } from '@/content/site';
import { contactFeedback } from '@/content/contact-feedback';
import { contactLimits } from './limits';
import { contactEmailSchema, validateContact } from './schema';
import { contactRateKey, consumeContactRate, type ContactRateResult } from './rate-limit';
import { sendContactMail, type ContactMail, type ContactMailConfig, type ContactMailResult } from './mail';
import type { ContactResponse } from './types';

type LogCode = 'configuration_missing' | 'provider_failed' | 'provider_timeout' | 'internal_failure';
interface HandlerDependencies {
  send: (mail: ContactMail, config: ContactMailConfig, signal: AbortSignal) => Promise<ContactMailResult>;
  rate: (key: string) => ContactRateResult;
  environment: () => NodeJS.ProcessEnv;
  log: (code: LogCode) => void;
}
class ContactBodyError extends Error { constructor(readonly code: 'invalid' | 'too_large' | 'timeout') { super(code); } }

export function escapeContactHTML(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

async function readContactBody(request: Request): Promise<unknown> {
  const declaredSize = Number(request.headers.get('content-length') ?? 0);
  if (declaredSize > contactLimits.bodyBytes) { void request.body?.cancel().catch(() => {}); throw new ContactBodyError('too_large'); }
  if (!request.body) throw new ContactBodyError('invalid');
  const reader = request.body.getReader();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => { reject(new ContactBodyError('timeout')); void reader.cancel().catch(() => {}); }, contactLimits.bodyTimeoutMs);
  });
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      total += value.byteLength;
      if (total > contactLimits.bodyBytes) throw new ContactBodyError('too_large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    void reader.cancel().catch(() => {});
    if (error instanceof ContactBodyError) throw error;
    throw new ContactBodyError('invalid');
  } finally { if (timeout) clearTimeout(timeout); try { reader.releaseLock(); } catch { /* Timed-out readers are already cancelled. */ } }
}

function mailConfig(environment: NodeJS.ProcessEnv): ContactMailConfig | null {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.CONTACT_FROM_EMAIL?.trim();
  const to = environment.CONTACT_TO_EMAIL?.trim();
  if (!apiKey || !from || !to || /[\r\n]/.test(from)) return null;
  const fromEmail = from.match(/<([^<>]+)>$/)?.[1] ?? from;
  if (!contactEmailSchema.safeParse(fromEmail).success || !contactEmailSchema.safeParse(to).success) return null;
  return { apiKey, from, to };
}

const defaultDependencies: HandlerDependencies = {
  send: sendContactMail,
  rate: consumeContactRate,
  environment: () => process.env,
  log: code => console.error(`[contact] ${code}`),
};

/** Injection makes every delivery/status branch testable without a real email. */
export function createContactHandler(overrides: Partial<HandlerDependencies> = {}) {
  const dependencies = { ...defaultDependencies, ...overrides };
  return async (request: Request): Promise<Response> => {
    const json = (body: ContactResponse, status: number, extra: Record<string, string> = {}) => Response.json(body, {
      status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
    });
    try {
      if ((request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() !== 'application/json') return json({ ok: false, code: 'unsupported' }, 415);
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return json({ ok: false, code: 'forbidden' }, 403);
      const environment = dependencies.environment();
      const rate = dependencies.rate(contactRateKey(request, environment.CONTACT_IP_HEADER));
      if (!rate.allowed) return json({ ok: false, code: 'rate_limited' }, 429, { 'Retry-After': String(rate.retryAfter) });
      const input = await readContactBody(request);
      if (input && typeof input === 'object' && 'website' in input && typeof input.website === 'string' && input.website.trim()) {
        return json({ ok: false, code: 'discarded' }, 202);
      }
      const parsed = validateContact(input);
      if (!parsed.success) return json({ ok: false, code: 'invalid', errors: parsed.errors }, 400);
      const config = mailConfig(environment);
      if (!config) { dependencies.log('configuration_missing'); return json({ ok: false, code: 'unavailable' }, 503); }
      const { name, email, organization, message, requestId } = parsed.data;
      const text = `${contactCopy.fields.name}: ${name}\n${contactCopy.fields.email}: ${email}\n${contactCopy.fields.organization}: ${organization}\n\n${message}`;
      const html = `<p><strong>${escapeContactHTML(contactCopy.fields.name)}</strong>: ${escapeContactHTML(name)}</p><p><strong>${escapeContactHTML(contactCopy.fields.email)}</strong>: ${escapeContactHTML(email)}</p><p><strong>${escapeContactHTML(contactCopy.fields.organization)}</strong>: ${escapeContactHTML(organization)}</p><p>${escapeContactHTML(message).replace(/\r?\n/g, '<br>')}</p>`;
      const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
      const cancel = () => controller.abort();
      request.signal.addEventListener('abort', cancel, { once: true });
      if (request.signal.aborted) controller.abort();
      try {
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new ContactBodyError('timeout')); }, contactLimits.mailTimeoutMs);
        });
        const result = await Promise.race([dependencies.send({ from: config.from, to: config.to, replyTo: email,
          subject: contactFeedback.mailSubject(name), text, html, idempotencyKey: `contact/${requestId ?? randomUUID()}` }, config, controller.signal), timeout]);
        if (controller.signal.aborted) { dependencies.log('provider_timeout'); return json({ ok: false, code: 'timeout' }, 504); }
        if (!result.accepted) { dependencies.log('provider_failed'); return json({ ok: false, code: 'unavailable' }, 503); }
        return json({ ok: true, code: 'sent' }, 200);
      } catch {
        const timedOut = controller.signal.aborted;
        dependencies.log(timedOut ? 'provider_timeout' : 'provider_failed');
        return json({ ok: false, code: timedOut ? 'timeout' : 'unavailable' }, timedOut ? 504 : 503);
      } finally {
        if (timer) clearTimeout(timer);
        request.signal.removeEventListener('abort', cancel);
      }
    } catch (error) {
      if (error instanceof ContactBodyError) return json({ ok: false, code: error.code === 'timeout' ? 'body_timeout' : error.code }, error.code === 'too_large' ? 413 : error.code === 'timeout' ? 408 : 400);
      dependencies.log('internal_failure'); return json({ ok: false, code: 'unavailable' }, 503);
    }
  };
}
