'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { contactCopy, siteConfig } from '@/content/site';
import { contactFeedback } from '@/content/contact-feedback';
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export function CopyEmail() {
  const interactive = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const [notice, setNotice] = useState('');
  const alive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(siteConfig.email);
      if (alive.current) setNotice(contactCopy.emailCopied);
    } catch { if (alive.current) setNotice(contactFeedback.copyFailed); }
    if (alive.current) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (alive.current) setNotice(''); }, 4500);
    }
  };
  return <div className="contact-copy-email">
    <button type="button" className="contact-copy-button" disabled={!interactive} onClick={() => { void copy(); }}>{contactCopy.copyEmail}</button>
    <p className="contact-copy-notice" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
  </div>;
}
