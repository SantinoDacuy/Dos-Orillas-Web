'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

/** El servidor entrega todos los proyectos; esta isla activa el carrusel (flechas, riel, teclado y arrastre,
 * sin scroll): mazo 3D en ≥1024px y ≥681px de alto, una portada por vez en el resto; tier 0 queda en lista. */
export function ProjectsMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getMountedSceneRoot('#proyectos');
    if (!root) return;
    const target: HTMLElement = root;
    const pinned = matchMedia('(min-width: 1024px) and (min-height: 681px)');
    let disposed = false;
    let stop = () => {};

    const enhance = () => {
      stop();
      stop = () => {};
      delete target.dataset.sceneFlow;
      const mode: 'deck' | 'slide' = pinned.matches ? 'deck' : 'slide';
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
        void import('./projects-timeline').then(async ({ mountProjects }) => {
          if (controller.signal.aborted) return;
          const cleanup = await mountProjects(target, tier, mode, controller.signal);
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
    return () => {
      disposed = true;
      pinned.removeEventListener('change', change);
      stop();
      delete target.dataset.sceneFlow;
    };
  }, [tier, ready]);
  return null;
}
