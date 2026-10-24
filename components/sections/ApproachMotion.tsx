'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

/** Soluciones: el servidor entrega todo el contenido y la escena es plana en todos los tamaños.
 * El cronograma (sólo reveals por scroll) se importa recién al acercarse; tier 0 queda estático. */
export function ApproachMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getMountedSceneRoot('#soluciones');
    if (!root) return;
    const controller = new AbortController();
    let dispose = () => {};
    let requested = false;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: '1400px 0px' });
    function load() {
      if (requested || controller.signal.aborted || !root) return;
      const target: HTMLElement = root;
      requested = true;
      observer.disconnect();
      void import('./approach-timeline').then(async ({ mountApproach }) => {
        if (controller.signal.aborted) return;
        const cleanup = await mountApproach(target, tier, controller.signal);
        if (controller.signal.aborted) cleanup(); else dispose = cleanup;
      }).catch(() => {
        if (!controller.signal.aborted) target.dataset.sceneFlow = 'true';
      });
    }
    observer.observe(root);
    return () => {
      controller.abort();
      observer.disconnect();
      dispose();
      delete root.dataset.sceneFlow;
    };
  }, [tier, ready]);
  return null;
}
