'use client';

import { useDeferredSceneController } from '@/hooks/useDeferredSceneController';

interface DeferredProjectsMotionProps {
  grid?: boolean;
  keyVisuals?: boolean;
  gridRootId?: string;
}

const loadController = () => import('./DeferredProjectsController').then(module => module.DeferredProjectsController);

/** One thin page island; all titles/links/media remain in the server HTML. */
export function DeferredProjectsMotion(props: DeferredProjectsMotionProps = {}) {
  // Case pages keep their Key Visual owner even when the grid is disabled.
  // The deferred controller retains its 1000 px observer after native travel.
  const selector = '[data-scene="project-grid"]'
    + (props.keyVisuals !== false ? ',[data-project-case]' : '');
  return useDeferredSceneController(selector, loadController, props);
}
