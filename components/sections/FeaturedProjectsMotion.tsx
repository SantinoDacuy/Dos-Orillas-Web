'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

/** One deferred island, compatible with DeferredProjectsMotion's export contract. */
export function FeaturedProjectsMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0 || !('IntersectionObserver' in window)) return;
    // IO selects the visible Activity owner without measuring at hydration.
    const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-scene="featured"]'));
    if (!roots.length) return;
    const controller = new AbortController();
    let requested = false;
    let started = false;
    let observer: IntersectionObserver | undefined;
    let hashObserver: IntersectionObserver | undefined;
    const deferredHeaders = new Map<Element, HTMLElement>();
    let dispose = () => {};
    const load = (root: HTMLElement) => {
      if (requested || controller.signal.aborted) return;
      requested = true;
      observer?.disconnect();
      hashObserver?.disconnect();
      // Real layout precedes the runtime import and its first geometry read.
      root.dataset.narrativeLayoutReady = 'true';
      window.dispatchEvent(new Event('dos-orillas:refresh'));
      void import('./featured-projects-arc').then(({ mountFeaturedArc }) => {
        if (controller.signal.aborted) return;
        dispose = mountFeaturedArc(root, controller.signal).dispose;
      }).catch(() => { /* Every server card/link remains readable in flow. */ });
    };
    const begin = () => {
      if (started || controller.signal.aborted) return;
      started = true;
      window.removeEventListener('scroll', begin);
      restoredPosition?.disconnect();
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRect.height > 0) load(entry.target as HTMLElement);
        }
      }, { rootMargin: '600px 0px' });
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      let target: HTMLElement | null = null;
      if (location.hash && navigation?.type !== 'back_forward') {
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* A malformed fragment retains normal native flow. */ }
      }
      for (const root of roots) {
        const downstream = target && !root.contains(target) && Boolean(root.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
        const header = downstream ? root.querySelector<HTMLElement>('.featured-meta') : null;
        if (header) deferredHeaders.set(header, root);
        else observer.observe(root);
      }
      if (deferredHeaders.size) {
        // A downstream deep link/reload has already crossed the full SSR list.
        // Shrinking that offscreen list would move the native anchor upward.
        // Keep it in flow until its heading is actually approached again. The
        // zero top margin cannot activate an upstream owner behind the visitor.
        // Normal travel and case/browser Back keep the original root observer.
        hashObserver = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRect.height > 0 && entry.boundingClientRect.top >= -76) {
              const root = deferredHeaders.get(entry.target);
              if (root) load(root);
            }
          }
        }, { rootMargin: '0px 0px 600px 0px', threshold: [0, 1] });
        deferredHeaders.forEach((_root, header) => hashObserver?.observe(header));
      }
    };
    window.addEventListener('scroll', begin, { passive: true, once: true });
    const sentinel = document.querySelector('.nav-sentinel');
    const restoredPosition = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.boundingClientRect.top < 0 ||
        (!sentinel && entry.isIntersecting && entry.intersectionRect.height > 0))) begin();
    }, { threshold: 1 });
    if (sentinel) restoredPosition.observe(sentinel);
    else roots.forEach(root => restoredPosition?.observe(root));
    if (location.hash) begin();
    return () => {
      controller.abort();
      observer?.disconnect();
      hashObserver?.disconnect();
      deferredHeaders.clear();
      restoredPosition?.disconnect();
      window.removeEventListener('scroll', begin);
      dispose();
    };
  }, [ready, tier]);
  return null;
}
