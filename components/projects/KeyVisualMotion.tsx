'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot, getMountedSceneElements } from '@/lib/get-visible-root';

/** Optional single island for the whole projects section. No GSAP import. */
export function KeyVisualMotion() {
  const { ready, tier } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0 || !('IntersectionObserver' in window)) return;
    const roots = getMountedSceneElements('[data-key-visual]');
    if (!roots.length) return;
    const visible = new Set<HTMLElement>();
    const observed = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    let activeObserver: MutationObserver | undefined;
    let alive = true;
    let started = false;

    const syncVisibility = () => {
      if (!alive) return;
      for (const root of roots) {
        const slide = root.closest<HTMLElement>('[data-featured-slide]');
        const scene = slide?.closest<HTMLElement>('[data-scene="featured"]');
        const indexed = scene?.dataset.featuredMode === 'arc' || scene?.dataset.featuredMode === 'stack' || scene?.dataset.featuredMode === 'dolly';
        const active = !root.closest('[inert], [aria-hidden="true"]') && (!indexed || slide?.dataset.featuredSlide === scene?.dataset.featuredIndex);
        root.dataset.kvPlaying = String(visible.has(root) && !document.hidden && active);
      }
    };
    const observeReadyRoots = () => {
      if (!alive) return;
      for (const root of roots) {
        const grid = root.closest<HTMLElement>('[data-scene="project-grid"]');
        const featured = root.closest<HTMLElement>('[data-scene="featured"]');
        const pendingFeatured = tier === 1 && featured?.dataset.featuredMode === 'flow' && featured.dataset.featuredCvPolicy === 'flow-tier1' && featured.dataset.narrativeLayoutReady !== 'true';
        const ready = (!grid || grid.dataset.narrativeLayoutReady === 'true') && !pendingFeatured;
        if (ready && !observed.has(root)) { observer?.observe(root); observed.add(root); }
        else if (!ready && observed.has(root)) { observer?.unobserve(root); observed.delete(root); visible.delete(root); }
      }
    };
    const refresh = () => { observeReadyRoots(); syncVisibility(); };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      window.removeEventListener('scroll', begin);
      restoredPosition?.disconnect();
      observer = new IntersectionObserver(entries => {
        if (!alive) return;
        for (const entry of entries) {
          const root = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(root);
            root.dataset.kvEnhanced = 'true';
          } else visible.delete(root);
        }
        syncVisibility();
      }, { threshold: 0.08 });
      observeReadyRoots();
      const targets = new Set<HTMLElement>();
      for (const root of roots) {
        const slide = root.closest<HTMLElement>('[data-featured-slide]');
        const scene = slide?.closest<HTMLElement>('[data-scene="featured"]');
        const grid = root.closest<HTMLElement>('[data-scene="project-grid"]');
        if (slide) targets.add(slide);
        if (scene) targets.add(scene);
        if (grid) targets.add(grid);
      }
      activeObserver = new MutationObserver(refresh);
      for (const target of targets) activeObserver.observe(target, { attributes: true, attributeFilter: ['data-featured-index', 'data-featured-mode', 'data-featured-cv-policy', 'inert', 'aria-hidden', 'data-narrative-layout-ready'] });
      document.addEventListener('visibilitychange', syncVisibility);
      window.addEventListener('dos-orillas:refresh', refresh);
    };
    window.addEventListener('scroll', begin, { passive: true, once: true });
    const sentinel = getMountedSceneRoot('.nav-sentinel');
    const restoredPosition = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.boundingClientRect.top < 0 ||
        (!sentinel && entry.isIntersecting && entry.intersectionRect.height > 0))) begin();
    }, { threshold: 1 });
    if (sentinel) restoredPosition.observe(sentinel);
    else {
      // A skipped scene is observed as a whole, never via its CV descendants.
      const scenes = new Set(roots.map(root => root.closest<HTMLElement>('[data-scene]') ?? root));
      scenes.forEach(scene => restoredPosition?.observe(scene));
    }
    return () => {
      alive = false;
      restoredPosition?.disconnect();
      window.removeEventListener('scroll', begin);
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('dos-orillas:refresh', refresh);
      observer?.disconnect();
      activeObserver?.disconnect();
      visible.clear();
      observed.clear();
      for (const root of roots) {
        delete root.dataset.kvEnhanced;
        delete root.dataset.kvPlaying;
      }
    };
  }, [ready, tier]);
  return null;
}
