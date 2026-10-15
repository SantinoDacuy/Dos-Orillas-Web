'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

/** The server owns every word and image; this island only schedules enhancement. */
export function ManifestoMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = document.querySelector<HTMLElement>('[data-scene="manifesto"]');
    if (!root) return;
    const controller = new AbortController();
    let observer: IntersectionObserver | undefined;
    let dispose = () => {};
    let requested = false;

    const load = () => {
      if (requested || controller.signal.aborted) return;
      requested = true;
      observer?.disconnect();
      void import('./manifesto-motion')
        .then(({ mountManifesto }) => {
          if (!controller.signal.aborted) dispose = mountManifesto(root, tier, controller.signal);
        })
        .catch(() => {
          if (!controller.signal.aborted) root.dataset.manifestoFlow = 'true';
        });
    };

    const begin = () => {
      if (controller.signal.aborted) return;
      if (!('IntersectionObserver' in window)) {
        load();
        return;
      }
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) load();
        },
        { rootMargin: '800px 0px' }
      );
      observer.observe(root);
    };

    begin();

    return () => {
      controller.abort();
      observer?.disconnect();
      dispose();
      delete root.dataset.manifestoFlow;
      delete root.dataset.manifestoMode;
      delete root.dataset.manifestoReady;
    };
  }, [tier, ready]);

  return null;
}
