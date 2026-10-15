'use client';

import { createElement, useEffect, useState, type Attributes, type ComponentType, type ReactElement } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot, getMountedSceneElements } from '@/lib/get-visible-root';

/** Synchronous native layout access; observers/runtimes wait for actual travel. */
export function useDeferredSceneController<Props extends object>(selector: string,
  load: () => Promise<ComponentType<Props>>, props?: Props,
  layoutReady = 'narrativeLayoutReady'): ReactElement | null {
  const { ready, tier } = useMotion();
  const [Controller, setController] = useState<ComponentType<Props> | null>(null);
  useEffect(() => {
    if (!ready || tier === 0) return;
    let alive = true;
    let started = false;
    let restoration: IntersectionObserver | undefined;
    const roots = getMountedSceneElements(selector);
    const sentinel = getMountedSceneRoot('.nav-sentinel');
    const unlock = () => {
      let changed = false;
      roots.forEach(root => {
        if (root.dataset[layoutReady] !== 'true') {
          root.dataset[layoutReady] = 'true';
          changed = true;
        }
      });
      if (changed) window.dispatchEvent(new Event('dos-orillas:refresh'));
    };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      window.removeEventListener('scroll', begin);
      restoration?.disconnect();
      void load().then(Component => {
        if (alive) setController(() => Component);
      }).catch(() => { /* Complete server content survives a failed runtime. */ });
    };
    const anchor = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) unlock();
    };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Tab') unlock(); };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && roots.some(root => root.contains(event.target as Element))) begin();
    };
    const restored = () => {
      if (!alive) return;
      if (location.hash) { unlock(); begin(); }
      else if (!started && restoration) {
        restoration.disconnect();
        if (sentinel) restoration.observe(sentinel);
        else roots.forEach(root => restoration?.observe(root));
      }
    };
    document.addEventListener('click', anchor, true);
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('focusin', focus, true);
    window.addEventListener('scroll', begin, { passive: true, once: true });
    window.addEventListener('hashchange', restored);
    window.addEventListener('pageshow', restored);
    if ('IntersectionObserver' in window) {
      restoration = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.boundingClientRect.top < 0 ||
          (!sentinel && entry.isIntersecting && entry.intersectionRect.height > 0))) begin();
      }, { threshold: 1 });
    }
    restored();
    return () => {
      alive = false;
      restoration?.disconnect();
      document.removeEventListener('click', anchor, true);
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('focusin', focus, true);
      window.removeEventListener('scroll', begin);
      window.removeEventListener('hashchange', restored);
      window.removeEventListener('pageshow', restored);
    };
  }, [ready, tier, selector, load, layoutReady]);
  return ready && tier > 0 && Controller
    ? createElement(Controller, props as (Props & Attributes) | undefined) : null;
}
