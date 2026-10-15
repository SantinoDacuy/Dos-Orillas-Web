'use client';

import { useEffect } from 'react';

/** Scripts inserted by React route navigation do not execute. Keep that path
 * and an externally hydrated document with a blocked inline bootstrap usable. */
export function NarrativeStyleActivation() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.narrativeCss === 'pending') return;
    // Cached Home instances share the global stylesheet. Activate each new
    // link so evicting an older hidden instance cannot remove the only owner.
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[data-narrative-css-sheet]'));
    const pending = links.filter(link => link.media !== 'all');
    if (!pending.length) return;
    let frame = 0;
    const refresh = () => {
      root.dataset.narrativeCssLoaded = 'true';
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        window.dispatchEvent(new Event('dos-orillas:refresh'));
      });
    };
    pending.forEach(link => { link.media = 'all'; });
    root.dataset.narrativeCss = 'ready';
    for (const link of pending) {
      if (link.sheet) refresh();
      else link.addEventListener('load', refresh, { once: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      pending.forEach(link => link.removeEventListener('load', refresh));
    };
  }, []);
  return null;
}
