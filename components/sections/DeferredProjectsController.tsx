'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot, getMountedSceneElements } from '@/lib/get-visible-root';

const loaders = {
  grid: () => import('./ProjectsGridMotion').then(module => module.ProjectsGridMotion),
  keyVisuals: () => import('@/components/projects/KeyVisualMotion').then(module => module.KeyVisualMotion),
};
type Island = keyof typeof loaders;
type Loaded = {
  grid?: ComponentType<{ rootId?: string }>;
  keyVisuals?: ComponentType;
};
interface DeferredProjectsMotionProps {
  grid?: boolean;
  keyVisuals?: boolean;
  gridRootId?: string;
}

/** One page island; every project title/link/media remains server-rendered. */
export function DeferredProjectsController({
  grid = true, keyVisuals = true,
  gridRootId = 'todos-los-proyectos',
}: DeferredProjectsMotionProps = {}) {
  const { ready, tier } = useMotion();
  const [components, setComponents] = useState<Loaded>({});

  useEffect(() => {
    if (!ready || tier === 0) return;
    let alive = true;
    let started = false;
    let observer: IntersectionObserver | undefined;
    const requested = new Set<Island>();
    const targets = new Map<Element, Island>();
    const observedKeys = new WeakSet<Element>();
    const gridRoot = grid ? getMountedSceneRoot(`#${CSS.escape(gridRootId)}`) : null;

    // KeyVisuals inside a skipped flow scene wait until its root is unlocked.
    // Enhanced Arc never uses CV. Do not measure descendants to decide near.
    function observeKeys() {
      if (!alive || !observer || !keyVisuals || requested.has('keyVisuals')) return;
      getMountedSceneElements('[data-key-visual]').forEach(element => {
        const ancestor = element.closest<HTMLElement>('[data-scene="project-grid"]');
        const policy = ancestor?.dataset.gridMotionPolicy === 'native-tier1' && ancestor.dataset.gridIntrinsic === 'true';
        const blocked = tier === 1 && policy && ancestor?.dataset.narrativeLayoutReady !== 'true';
        if (blocked || observedKeys.has(element)) return;
        observedKeys.add(element);
        targets.set(element, 'keyVisuals');
        observer?.observe(element);
      });
    }
    const unlockGrid = () => {
      if (!gridRoot || gridRoot.dataset.narrativeLayoutReady === 'true') return;
      gridRoot.dataset.narrativeLayoutReady = 'true';
      // The owner latches real layout before an import, native anchor or focus.
      window.dispatchEvent(new Event('dos-orillas:refresh'));
      observeKeys();
    };
    const load = (island: Island) => {
      if (!alive || requested.has(island)) return;
      requested.add(island);
      if (island === 'grid') unlockGrid();
      // No content is owned by these components. Failed imports retain SSR.
      const failed = () => {};
      if (island === 'grid') {
        void loaders.grid().then(Component => {
          if (alive) setComponents(previous => ({ ...previous, grid: Component }));
        }).catch(failed);
      } else {
        void loaders.keyVisuals().then(Component => {
          if (alive) setComponents(previous => ({ ...previous, keyVisuals: Component }));
        }).catch(failed);
      }
    };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      if (!('IntersectionObserver' in window)) return;
      // Runtime observers/imports wait for native travel or an IO restoration.
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const island = targets.get(entry.target);
          if (!island) continue;
          load(island);
          observer?.unobserve(entry.target);
        }
      }, { rootMargin: '1000px 0px' });
      if (gridRoot) { targets.set(gridRoot, 'grid'); observer.observe(gridRoot); }
      observeKeys();
    };
    // The thin owner has already handled native travel/restoration.
    window.addEventListener('dos-orillas:refresh', observeKeys);
    begin();
    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener('dos-orillas:refresh', observeKeys);
      targets.clear();
      // Keep layout-ready latches: re-enabling motion must not re-collapse a
      // scene whose real dimensions were already used by navigation or focus.
    };
  }, [ready, tier, grid, keyVisuals, gridRootId]);

  if (!ready || tier === 0) return null;
  const Grid = components.grid;
  const KeyVisuals = components.keyVisuals;
  return <>
    {grid && Grid && <Grid rootId={gridRootId} />}
    {keyVisuals && KeyVisuals && <KeyVisuals />}
  </>;
}
