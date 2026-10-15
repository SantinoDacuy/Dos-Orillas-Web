'use client';

import { useDeferredSceneController } from '@/hooks/useDeferredSceneController';

const loadController = () => import('./DeferredNarrativeController').then(module => module.DeferredNarrativeController);

/** Native anchors/Tab unlock immediately; runtime orchestration waits for travel. */
export function DeferredNarrativeMotion() {
  return useDeferredSceneController('#manifiesto,#soluciones,#proceso', loadController);
}
