'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

/** El servidor entrega todo el texto; esta isla agrega los reveals en flujo (tier > 0). */
export function StudioMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getMountedSceneRoot('#el-estudio');
    if (!root) return;
    const target: HTMLElement = root;
    let stop = () => {};

    const enhance = () => {
      stop();
      stop = () => {};
      delete target.dataset.sceneFlow;
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
        void import('./studio-timeline').then(async ({ mountStudio }) => {
          if (controller.signal.aborted) return;
          const cleanup = await mountStudio(target, controller.signal);
          if (controller.signal.aborted) cleanup(); else dispose = cleanup;
        }).catch(() => {
          if (!controller.signal.aborted) target.dataset.sceneFlow = 'true';
        });
      }
      observer.observe(target);
      stop = () => { controller.abort(); observer.disconnect(); dispose(); };
    };

    enhance();
    return () => {
      stop();
      delete target.dataset.sceneFlow;
    };
  }, [tier, ready]);
  return null;
}
