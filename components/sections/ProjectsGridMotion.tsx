'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';
import type { ProjectGridAnimator } from './projects-grid-motion';

function DeferredProjectMotion({ sectionId, kind }: { sectionId: string; kind: 'grid' }) {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0 || !('IntersectionObserver' in window)) return;
    const root = getMountedSceneRoot(`#${CSS.escape(sectionId)}`);
    if (!root) return;
    const nativeGrid = kind === 'grid' && tier === 1;
    const previousReady = root.getAttribute('data-narrative-layout-ready');
    const controller = new AbortController();
    let disposed = false;
    let requested = false;
    let started = false;
    let observer: IntersectionObserver | undefined;
    let animator: ProjectGridAnimator | undefined;
    const unlock = () => {
      if (!nativeGrid || root.dataset.narrativeLayoutReady === 'true') return;
      root.dataset.narrativeLayoutReady = 'true';
      window.dispatchEvent(new Event('dos-orillas:refresh'));
    };
    const requestMotion = () => {
      if (disposed || requested) return;
      requested = true;
      observer?.disconnect();
      // CV is disabled before either setup or asynchronous geometry can run.
      unlock();
      const loading = nativeGrid
        ? import('./projects-grid-lite').then(runtime => runtime.mountProjectGridLite(root, controller.signal))
        : import('./projects-grid-motion').then(async runtime => {
          if (disposed || controller.signal.aborted) return { dispose: () => {} };
          return runtime.mountProjectGrid(root, tier, controller.signal);
        });
      void loading.then(mounted => {
        if (disposed || controller.signal.aborted) mounted.dispose();
        else animator = mounted;
      }).catch(() => { /* Complete SSR cards remain visible after an import failure. */ });
    };
    const firstScroll = () => {
      if (disposed || started) return;
      started = true;
      window.removeEventListener('scroll', firstScroll);
      restoredPosition?.disconnect();
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) requestMotion();
      }, { rootMargin: '400px 0px' });
      observer.observe(root);
    };
    const anchor = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) unlock();
    };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Tab') unlock(); };
    window.addEventListener('scroll', firstScroll, { passive: true, once: true });
    if (nativeGrid) {
      document.addEventListener('click', anchor, true);
      document.addEventListener('keydown', keyboard, true);
    }
    const sentinel = getMountedSceneRoot('.nav-sentinel');
    const restoredPosition = new IntersectionObserver(([entry]) => {
      if (entry && (entry.boundingClientRect.top < 0 ||
        (!sentinel && entry.isIntersecting && entry.intersectionRect.height > 0))) firstScroll();
    }, { threshold: 1 });
    restoredPosition.observe(sentinel ?? root);
    if (location.hash) firstScroll();
    return () => {
      disposed = true;
      controller.abort();
      observer?.disconnect();
      restoredPosition?.disconnect();
      window.removeEventListener('scroll', firstScroll);
      document.removeEventListener('click', anchor, true);
      document.removeEventListener('keydown', keyboard, true);
      animator?.dispose();
      if (nativeGrid) {
        if (previousReady === null) delete root.dataset.narrativeLayoutReady;
        else root.setAttribute('data-narrative-layout-ready', previousReady);
      }
    };
  }, [sectionId, kind, tier, ready]);
  return null;
}

export function ProjectsGridMotion({ rootId = 'todos-los-proyectos' }: { rootId?: string } = {}) {
  return <DeferredProjectMotion sectionId={rootId} kind="grid" />;
}
