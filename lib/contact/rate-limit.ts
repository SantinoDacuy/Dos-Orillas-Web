import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { contactLimits } from './limits';

type Bucket = { count: number; resetAt: number };
export interface ContactRateResult { allowed: boolean; retryAfter: number }
const salt = randomBytes(32);
const trustedHeaders = new Set(['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-forwarded-for']);

/** Headers are trusted only after the deployment owner configures a rewriting proxy. */
export function contactRateKey(request: Request, trustedHeader?: string): string {
  if (!trustedHeader || !trustedHeaders.has(trustedHeader)) return 'anonymous';
  const candidate = request.headers.get(trustedHeader)?.split(',')[0]?.trim() ?? '';
  if (candidate.length > 64 || !isIP(candidate)) return 'anonymous';
  return createHmac('sha256', salt).update(candidate).digest('hex');
}

export function createContactRateLimiter() {
  const buckets = new Map<string, Bucket>();
  let lastCleanup = 0;
  return (key: string, now = Date.now()): ContactRateResult => {
    if (now - lastCleanup >= 60000 || buckets.size >= contactLimits.rateEntries) {
      for (const [entry, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(entry);
      lastCleanup = now;
    }
    const existing = buckets.get(key);
    if (existing && existing.resetAt > now) {
      if (existing.count >= contactLimits.rateRequests) return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
      existing.count += 1;
      return { allowed: true, retryAfter: 0 };
    }
    // Do not evict a live bucket: capacity exhaustion must not reset another limit.
    if (buckets.size >= contactLimits.rateEntries) return { allowed: false, retryAfter: 60 };
    buckets.set(key, { count: 1, resetAt: now + contactLimits.rateWindowMs });
    return { allowed: true, retryAfter: 0 };
  };
}

export const consumeContactRate = createContactRateLimiter();
