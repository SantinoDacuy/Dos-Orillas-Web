'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ChevronDown, Send, ShieldCheck } from 'lucide-react';
import { contactCopy, siteConfig } from '@/content/site';
import { contactFeedback } from '@/content/contact-feedback';
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
  submitPromise ??= import('@/lib/contact/client-submit').catch((error) => {
    submitPromise = null;
    throw error;
  });
  return submitPromise;
}

const REASONS = [
  'Información de proyecto nuevo',
  'Desarrollo de software / Web a medida',
  'Rediseño o modernización de sistema',
  'Consultoría técnica / Arquitectura',
  'Otro motivo',
] as const;

export function ContactForm() {
  const interactive = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string>(REASONS[0]);
  const summary = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLHeadingElement>(null);
  const submission = useRef<ContactClientSession>({ alive: false, busy: false, controller: null });

  useEffect(() => {
    const session = submission.current;
    session.alive = true;
    return () => {
      session.alive = false;
      session.controller?.abort();
    };
  }, []);

  useEffect(() => {
    if (status === 'success') success.current?.focus();
    else if (status === 'error') summary.current?.focus();
  }, [status, attempt]);

  const edit = (field: ContactField) => {
    submission.current.requestId = undefined;
    if (errors[field]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = submission.current;
    if (session.busy) return;
    session.busy = true;

    const form = event.currentTarget;
    const values = new FormData(form);

    // Integrate selected reason into the message for clear context
    const rawMessage = (values.get('message') as string) || '';
    if (selectedReason) {
      values.set('message', `[Motivo: ${selectedReason}]\n\n${rawMessage}`);
    }
    values.delete('reason');

    setAttempt((previous) => previous + 1);
    setErrors({});
    setNotice('');
    setStatus('loading');

    try {
      const { submitContact } = await loadSubmit();
      const result = await submitContact(values, session);
      if (!session.alive || !result) return;
      if (result.status === 'success') {
        form.reset();
        setSelectedReason(REASONS[0]);
        setStatus('success');
      } else {
        setErrors(result.errors);
        setNotice(result.notice);
        setStatus('error');
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

  const description = (field: ContactField) =>
    [field === 'message' ? 'contact-message-helper' : '', errors[field] ? `contact-${field}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="contact-form-island" data-contact-state={status}>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status === 'loading' ? contactCopy.loading : status === 'success' ? contactCopy.success : ''}
      </p>

      {status === 'success' ? (
        <div className="contact-success">
          <span className="contact-success-bridge" aria-hidden="true" />
          <h3 ref={success} tabIndex={-1} className="contact-success-title">
            ¡Mensaje enviado con éxito!
          </h3>
          <p className="contact-success-desc">
            Gracias por escribirnos. Ya recibimos tu consulta y te responderemos a la brevedad.
          </p>
          <button
            type="button"
            className="contact-new-btn"
            onClick={() => setStatus('idle')}
          >
            Enviar otra consulta
          </button>
        </div>
      ) : (
        <form
          action="/api/contact"
          method="post"
          noValidate
          suppressHydrationWarning
          onSubmit={(event) => {
            void submit(event);
          }}
          onFocusCapture={() => {
            void loadSubmit().catch(() => {});
          }}
          aria-busy={status === 'loading'}
          className="contact-modern-form"
        >
          {status === 'error' && (
            <div className="contact-error-summary" ref={summary} tabIndex={-1} role="alert">
              <h3>{Object.keys(errors).length ? contactCopy.errors.summary : notice}</h3>
              {Object.keys(errors).length > 0 && (
                <ul>
                  {fields.map(
                    (field) =>
                      errors[field] && (
                        <li key={field}>
                          <a href={`#contact-${field}`}>
                            {contactCopy.fields[field]}: {errors[field]}
                          </a>
                        </li>
                      ),
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Row 1: Nombre & Correo electrónico */}
          <div className="contact-form-row">
            <div className="contact-field">
              <label htmlFor="contact-name">
                {contactCopy.fields.name} <span className="contact-required">*</span>
              </label>
              <div className="contact-control">
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  required
                  maxLength={contactLimits.name}
                  suppressHydrationWarning
                  disabled={status === 'loading'}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={description('name')}
                  onChange={() => edit('name')}
                />
              </div>
              {errors.name && <p id="contact-name-error" className="contact-field-error">{errors.name}</p>}
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">
                {contactCopy.fields.email} <span className="contact-required">*</span>
              </label>
              <div className="contact-control">
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="ejemplo@correo.com"
                  required
                  maxLength={contactLimits.email}
                  suppressHydrationWarning
                  disabled={status === 'loading'}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={description('email')}
                  onChange={() => edit('email')}
                />
              </div>
              {errors.email && <p id="contact-email-error" className="contact-field-error">{errors.email}</p>}
            </div>
          </div>

          {/* Row 2: Motivo de contacto (Selector) */}
          <div className="contact-field">
            <label htmlFor="contact-reason">Motivo de contacto</label>
            <div className="contact-control contact-select-wrap">
              <select
                id="contact-reason"
                name="reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={status === 'loading'}
                className="contact-select"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r} className="contact-option">
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="contact-select-chevron" size={18} aria-hidden="true" />
            </div>
          </div>

          {/* Row 3: Organización o empresa (opcional) */}
          <div className="contact-field">
            <label htmlFor="contact-organization">
              {contactCopy.fields.organization}
              <span className="contact-optional">{contactFeedback.optional}</span>
            </label>
            <div className="contact-control">
              <input
                id="contact-organization"
                name="organization"
                type="text"
                autoComplete="organization"
                placeholder="Nombre de tu empresa o marca (opcional)"
                maxLength={contactLimits.organization}
                suppressHydrationWarning
                disabled={status === 'loading'}
                aria-invalid={Boolean(errors.organization)}
                aria-describedby={description('organization')}
                onChange={() => edit('organization')}
              />
            </div>
            {errors.organization && (
              <p id="contact-organization-error" className="contact-field-error">
                {errors.organization}
              </p>
            )}
          </div>

          {/* Row 4: Tu mensaje */}
          <div className="contact-field">
            <label htmlFor="contact-message">
              {contactCopy.fields.message} <span className="contact-required">*</span>
            </label>
            <div className="contact-control">
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                maxLength={contactLimits.message}
                placeholder="Contanos brevemente qué querés resolver, objetivos o plazos estimados..."
                suppressHydrationWarning
                disabled={status === 'loading'}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={description('message')}
                onChange={() => edit('message')}
              />
            </div>
            <p id="contact-message-helper" className="contact-helper">
              {contactCopy.helper}
            </p>
            {errors.message && (
              <p id="contact-message-error" className="contact-field-error">
                {errors.message}
              </p>
            )}
          </div>

          {/* Honeypot */}
          <div className="contact-honeypot" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
              suppressHydrationWarning
            />
          </div>

          {/* Submit button */}
          <button
            className="btn btn-primary btn-block contact-submit"
            type="submit"
            suppressHydrationWarning
            disabled={!interactive || status === 'loading'}
          >
            <span className="flex items-center justify-center gap-2">
              <span>{status === 'loading' ? 'Enviando mensaje...' : 'Enviar mensaje'}</span>
              <Send size={16} className="contact-submit-icon" />
            </span>
            <span className="contact-submit-progress" aria-hidden="true" />
          </button>

          {/* Terms & Privacy Assurance */}
          <div className="contact-terms-card">
            <div className="contact-terms-header">
              <ShieldCheck className="contact-terms-icon" size={16} aria-hidden="true" />
              <span className="contact-terms-title">Términos y Privacidad de Datos</span>
            </div>
            <p className="contact-terms-text">
              Tus datos son 100% confidenciales y seguros. No compartimos tu información con terceros ni la utilizamos para fines comerciales ajenos. La información ingresada se utiliza exclusivamente para ponernos en contacto con vos, evaluar tu caso y asesorarte sobre tu proyecto.
            </p>
          </div>

          <noscript>
            <p className="contact-nojs">{contactFeedback.noJavaScript}</p>
          </noscript>
        </form>
      )}

      <div className="contact-direct-wrap">
        <span>¿Preferís escribir directamente por correo?</span>
        <a className="contact-email-link" href={siteConfig.emailHref}>
          {siteConfig.email} ↗
        </a>
      </div>
    </div>
  );
}

export default ContactForm;
