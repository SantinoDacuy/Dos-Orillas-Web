'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { contactCopy, siteConfig } from '@/content/site';
import { contactFeedback, privacyDocumentCopy } from '@/content/contact-feedback';
import { contactLimits } from '@/lib/contact/limits';
import type { ContactErrors, ContactField } from '@/lib/contact/types';
import type { ContactClientSession } from '@/lib/contact/client-submit';

type Status = 'idle' | 'loading' | 'success' | 'error';
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;
const fields: readonly ContactField[] = ['name', 'email', 'organization', 'message'];
let submitPromise: Promise<typeof import('@/lib/contact/client-submit')> | null = null;
function loadSubmit() {
  submitPromise ??= import('@/lib/contact/client-submit').catch(error => { submitPromise = null; throw error; });
  return submitPromise;
}

export function ContactForm() {
  const interactive = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const summary = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLHeadingElement>(null);
  const submission = useRef<ContactClientSession>({ alive: false, busy: false, controller: null });
  useEffect(() => {
    const session = submission.current;
    session.alive = true;
    return () => { session.alive = false; session.controller?.abort(); };
  }, []);
  useEffect(() => {
    if (status === 'success') success.current?.focus();
    else if (status === 'error') summary.current?.focus();
  }, [status, attempt]);

  const edit = (field: ContactField) => {
    submission.current.requestId = undefined;
    if (errors[field]) setErrors(previous => { const next = { ...previous }; delete next[field]; return next; });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = submission.current;
    if (session.busy) return;
    session.busy = true;
    const form = event.currentTarget;
    const values = new FormData(form);
    setAttempt(previous => previous + 1); setErrors({}); setNotice(''); setStatus('loading');
    try {
      const { submitContact } = await loadSubmit();
      const result = await submitContact(values, session);
      if (!session.alive || !result) return;
      if (result.status === 'success') {
        form.reset(); setStatus('success');
      } else {
        setErrors(result.errors); setNotice(result.notice); setStatus('error');
      }
    } catch {
      if (session.alive) {
        setNotice(contactCopy.errors.network);
        setStatus('error');
      }
    } finally {
      session.busy = false;
    }
  };
  const description = (field: ContactField) => [field === 'message' ? 'contact-message-helper' : '', errors[field] ? `contact-${field}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <div className="contact-form-island" data-contact-state={status}>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status === 'loading' ? contactCopy.loading : status === 'success' ? contactCopy.success : ''}</p>
    {status === 'success' ? <div className="contact-success">
      <span className="contact-success-bridge" aria-hidden="true" />
      <h3 ref={success} tabIndex={-1}>{contactCopy.success}</h3>
    </div> : <form action="/api/contact" method="post" noValidate suppressHydrationWarning onSubmit={event => { void submit(event); }}
      onFocusCapture={() => { void loadSubmit().catch(() => {}); }} aria-busy={status === 'loading'}>
      {status === 'error' && <div className="contact-error-summary" ref={summary} tabIndex={-1} role="alert">
        <h3>{Object.keys(errors).length ? contactCopy.errors.summary : notice}</h3>
        {Object.keys(errors).length > 0 && <ul>{fields.map(field => errors[field] && <li key={field}>
          <a href={`#contact-${field}`}>{contactCopy.fields[field]}: {errors[field]}</a>
        </li>)}</ul>}
      </div>}
      <div className="contact-field">
        <label htmlFor="contact-name">{contactCopy.fields.name}</label>
        <div className="contact-control"><input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={contactLimits.name}
          suppressHydrationWarning disabled={status === 'loading'} aria-invalid={Boolean(errors.name)} aria-describedby={description('name')} onChange={() => edit('name')} />
          <span className="contact-field-bridge" aria-hidden="true" /></div>
        {errors.name && <p id="contact-name-error" className="contact-field-error">{errors.name}</p>}
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">{contactCopy.fields.email}</label>
        <div className="contact-control"><input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" required maxLength={contactLimits.email}
          suppressHydrationWarning disabled={status === 'loading'} aria-invalid={Boolean(errors.email)} aria-describedby={description('email')} onChange={() => edit('email')} />
          <span className="contact-field-bridge" aria-hidden="true" /></div>
        {errors.email && <p id="contact-email-error" className="contact-field-error">{errors.email}</p>}
      </div>
      <div className="contact-field">
        <label htmlFor="contact-organization">{contactCopy.fields.organization}<span className="contact-optional">{contactFeedback.optional}</span></label>
        <div className="contact-control"><input id="contact-organization" name="organization" type="text" autoComplete="organization" maxLength={contactLimits.organization}
          suppressHydrationWarning disabled={status === 'loading'} aria-invalid={Boolean(errors.organization)} aria-describedby={description('organization')} onChange={() => edit('organization')} />
          <span className="contact-field-bridge" aria-hidden="true" /></div>
        {errors.organization && <p id="contact-organization-error" className="contact-field-error">{errors.organization}</p>}
      </div>
      <div className="contact-field">
        <label htmlFor="contact-message">{contactCopy.fields.message}</label>
        <div className="contact-control"><textarea id="contact-message" name="message" required rows={6} maxLength={contactLimits.message}
          suppressHydrationWarning disabled={status === 'loading'} aria-invalid={Boolean(errors.message)} aria-describedby={description('message')} onChange={() => edit('message')} />
          <span className="contact-field-bridge" aria-hidden="true" /></div>
        <p id="contact-message-helper" className="contact-helper">{contactCopy.helper}</p>
        {errors.message && <p id="contact-message-error" className="contact-field-error">{errors.message}</p>}
      </div>
      <div className="contact-honeypot" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" suppressHydrationWarning />
      </div>
      <button className="contact-submit" type="submit" suppressHydrationWarning disabled={!interactive || status === 'loading'}>
        <span>{status === 'loading' ? contactCopy.loading : contactCopy.submit}</span>
        <span className="contact-submit-progress" aria-hidden="true" />
      </button>
      {contactCopy.privacy && <p className="contact-privacy-notice">{contactCopy.privacy}
        {privacyDocumentCopy.paragraphs?.length ? <>{' '}<a href="/privacidad">{contactFeedback.privacyLink}</a></> : null}
      </p>}
      <noscript><p className="contact-nojs">{contactFeedback.noJavaScript}</p></noscript>
    </form>}
    <a className="contact-email-alternative" href={siteConfig.emailHref}>{contactFeedback.alternative}</a>
  </div>;
}
