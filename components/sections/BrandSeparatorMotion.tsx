'use client';

import { useDeferredSceneController } from '@/hooks/useDeferredSceneController';

const loadController = () => import('./ProjectsGridMotion').then(module => module.BrandSeparatorMotion);

/** The band stays native SSR content; its observer/animation driver waits. */
export function BrandSeparatorMotion({ sectionId }: { sectionId: string }) {
  return useDeferredSceneController(`#${sectionId}`, loadController, { sectionId });
}
