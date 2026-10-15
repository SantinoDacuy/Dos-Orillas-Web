'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

export function SolutionsMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = document.getElementById('soluciones');
    if (!root) return;
    let alive = true;
    let near = false;
    let scrolled = false;
    let requested = false;
    let dispose = () => {};
    const load = () => {
      if (!alive || !near || requested) return;
      requested = true;
      observer.disconnect();
      void import('./solutions-controller').then(({ mountSolutionsController }) => {
        if (alive) dispose = mountSolutionsController(root, tier);
      }).catch(() => {});
    };
    const firstScroll = () => { scrolled = true; load(); };
    const observer = new IntersectionObserver(entries => {
      near = entries.some(entry => entry.isIntersecting);
      // A restored/hash position is already a reading interaction. Avoid the
      // synchronous scroll-position read while this section is below the fold.
      if (near && (scrolled || window.scrollY > 0)) load();
    }, { rootMargin: '800px 0px' });
    observer.observe(root);
    window.addEventListener('scroll', firstScroll, { passive: true, once: true });
    return () => {
      alive = false;
      observer.disconnect();
      window.removeEventListener('scroll', firstScroll);
      dispose();
    };
  }, [tier, ready]);
  return null;
}
