'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneElements } from '@/lib/get-visible-root';

/** Mount once beside the four server sections; the runtime is a separate chunk. */
export function EditorialMotionController() {
  const { ready, tier } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0 || !('IntersectionObserver' in window)) return;
    const roots = getMountedSceneElements('[data-editorial],#contacto');
    if (!roots.length) return;
    const controller = new AbortController();
    const cleanupScenes = new Map<HTMLElement, () => void>();
    const requested = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    const unlock = (root: HTMLElement) => {
      if (root.dataset.editorialLayoutReady === 'true') return;
      // The one-way latch avoids re-estimating an already visited section.
      root.dataset.editorialLayoutReady = 'true';
      window.dispatchEvent(new Event('dos-orillas:refresh'));
    };
    const enhance = (root: HTMLElement) => {
      if (requested.has(root) || controller.signal.aborted) return;
      requested.add(root);
      observer?.unobserve(root);
      unlock(root);
      if (!root.hasAttribute('data-editorial')) return;
      void import('./editorial-motion').then(({ mountEditorial }) => {
        if (!controller.signal.aborted && root.isConnected) {
          cleanupScenes.set(root, mountEditorial(root, tier, controller.signal));
        }
      }).catch(() => {
        if (!controller.signal.aborted) root.dataset.editorialProfile = 'flow';
      });
    };
    const begin = () => {
      if (controller.signal.aborted || observer) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) enhance(entry.target as HTMLElement); });
      }, { rootMargin: '600px 0px' });
      roots.forEach(root => observer?.observe(root));
    };
    begin();
    return () => {
      controller.abort();
      observer?.disconnect();
      cleanupScenes.forEach(cleanup => cleanup());
      roots.forEach(root => {
        delete root.dataset.editorialProfile;
        delete root.dataset.editorialReady;
      });
    };
  }, [ready, tier]);
  return null;
}
