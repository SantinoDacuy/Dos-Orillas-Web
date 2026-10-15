import 'server-only';

export interface ContactMail {
  from: string; to: string; replyTo: string; subject: string; text: string; html: string; idempotencyKey: string;
}
export interface ContactMailConfig { apiKey: string; from: string; to: string }
export interface ContactMailResult { accepted: boolean }

/** Use the official provider API directly; transport stays server-only and abortable. */
export async function sendContactMail(mail: ContactMail, config: ContactMailConfig, signal: AbortSignal): Promise<ContactMailResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal, cache: 'no-store',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': mail.idempotencyKey },
    body: JSON.stringify({ from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!response.ok) { void response.body?.cancel().catch(() => {}); return { accepted: false }; }
  const payload: unknown = await response.json();
  return { accepted: Boolean(payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string' && payload.id.length > 0) };
}
