'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

const loaders = {
  proceso: () => import('./ProcessMotion').then(module => module.ProcessMotion),
};
type Scene = keyof typeof loaders;

/** Imported only once native travel, restoration, hash or scene focus starts. */
export function DeferredNarrativeController() {
  const { ready, tier } = useMotion();
  const [components, setComponents] = useState<Partial<Record<Scene, ComponentType>>>({});
  useEffect(() => {
    if (!ready || tier === 0 || !('IntersectionObserver' in window)) return;
    let alive = true;
    const requested = new Set<Scene>();
    const roots = new Map<Scene, HTMLElement>();
    for (const scene of Object.keys(loaders) as Scene[]) {
      const root = getMountedSceneRoot(`#${scene}`);
      if (root) roots.set(scene, root);
    }
    const load = (scene: Scene) => {
      if (!alive || requested.has(scene)) return;
      requested.add(scene);
      const root = roots.get(scene);
      if (root && root.dataset.narrativeLayoutReady !== 'true') {
        root.dataset.narrativeLayoutReady = 'true';
        if (tier === 1) window.dispatchEvent(new Event('dos-orillas:refresh'));
      }
      void loaders[scene]().then(Component => {
        if (alive) setComponents(previous => ({ ...previous, [scene]: Component }));
      }).catch(() => {
        /* El contenido del servidor sigue completo si falla el import. */
      });
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) load(entry.target.id as Scene);
    }, { rootMargin: '1000px 0px' });
    roots.forEach(root => observer.observe(root));
    return () => { alive = false; observer.disconnect(); };
  }, [ready, tier]);
  if (!ready || tier === 0) return null;
  return <>{(Object.keys(loaders) as Scene[]).map(scene => {
    const Component = components[scene];
    return Component ? <Component key={scene} /> : null;
  })}</>;
}
