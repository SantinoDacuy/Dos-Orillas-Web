interface CoverRestorationOptions {
  pathname: string;
  signal: AbortSignal;
  onUserInput: () => void;
}

/** Loaded only after a real cover return, never during the initial page load. */
export function mountProjectCoverRestoration(element: HTMLElement, { pathname, signal, onUserInput }: CoverRestorationOptions): () => void {
  if (signal.aborted || !element.isConnected) return () => {};
  const link = element.closest<HTMLAnchorElement>('a') ?? element.parentElement?.querySelector<HTMLAnchorElement>('a[href]');
  let alive = true;
  let frame = 0;
  let resize: ResizeObserver | undefined;
  const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const repair = () => {
    if (!alive || signal.aborted || pathname !== location.pathname || !element.isConnected) return;
    // Deferred scene layouts may move a correctly restored semantic source.
    // Keep native input authoritative; repair only a source lost offscreen.
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom <= 88 || bounds.top >= innerHeight) {
      const target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight,
        bounds.top + scrollY - Math.max(88, (innerHeight - bounds.height) / 2)));
      if (window.__lenis) {
        window.__lenis.resize();
        window.__lenis.scrollTo(target, { immediate: true, force: true });
      } else window.scrollTo({ top: target, behavior: 'instant' });
    }
    if (document.activeElement === document.body || document.activeElement?.id === 'main-content') link?.focus({ preventScroll: true });
  };
  const schedule = () => {
    if (!alive || frame) return;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { frame = 0; repair(); });
    });
  };
  const cleanup = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    resize?.disconnect();
    window.removeEventListener('dos-orillas:refresh', schedule);
    for (const event of inputs) window.removeEventListener(event, onUserInput, true);
    signal.removeEventListener('abort', cleanup);
  };
  signal.addEventListener('abort', cleanup, { once: true });
  window.addEventListener('dos-orillas:refresh', schedule);
  for (const event of inputs) window.addEventListener(event, onUserInput, { capture: true, passive: true });
  const main = element.closest('main');
  if (main) { resize = new ResizeObserver(schedule); resize.observe(main); }
  void document.fonts.ready.then(schedule).catch(() => {});
  repair();
  schedule();
  return cleanup;
}
