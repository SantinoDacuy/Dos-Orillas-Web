'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

/** El servidor entrega todo el contenido. El Manifiesto elige por viewport entre el recorrido
 * fijado, los reveals de móvil o la lectura estática (poca altura); Soluciones siempre es plana.
 * El cronograma se importa recién al acercarse. */
export function ApproachMotion({ scene }: { scene: 'manifiesto' | 'soluciones' }) {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getMountedSceneRoot(`#${scene}`);
    if (!root) return;
    const pinned = matchMedia('(min-width: 768px) and (min-height: 681px)');
    const narrow = matchMedia('(max-width: 767px) and (min-height: 621px)');
    let disposed = false;
    let stop = () => {};

    const enhance = () => {
      stop();
      stop = () => {};
      delete root.dataset.sceneFlow;
      // Soluciones es plana en todos los tamaños: sólo reveals por scroll (tier 0 queda estático).
      const mode = scene === 'soluciones' ? 'flow' : pinned.matches ? 'pinned' : narrow.matches ? 'flow' : null;
      if (!mode) return;
      const target: HTMLElement = root;
      const chosen: 'pinned' | 'flow' = mode;
      const controller = new AbortController();
      let dispose = () => {};
      let requested = false;
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) load();
      }, { rootMargin: '1400px 0px' });
      function load() {
        if (requested || controller.signal.aborted) return;
        requested = true;
        observer.disconnect();
        void import('./approach-timeline').then(async ({ mountApproach }) => {
          if (controller.signal.aborted) return;
          const cleanup = await mountApproach(target, scene, tier, chosen, controller.signal);
          if (controller.signal.aborted) cleanup(); else dispose = cleanup;
        }).catch(() => {
          if (!controller.signal.aborted) target.dataset.sceneFlow = 'true';
        });
      }
      observer.observe(target);
      stop = () => { controller.abort(); observer.disconnect(); dispose(); };
    };

    enhance();
    const change = () => { if (!disposed) enhance(); };
    pinned.addEventListener('change', change);
    narrow.addEventListener('change', change);
    return () => {
      disposed = true;
      pinned.removeEventListener('change', change);
      narrow.removeEventListener('change', change);
      stop();
      delete root.dataset.sceneFlow;
    };
  }, [scene, tier, ready]);
  return null;
}
