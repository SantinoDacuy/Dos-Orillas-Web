'use client';

import { useDeferredSceneController } from '@/hooks/useDeferredSceneController';

const loadController = () => import('./EditorialMotionController').then(module => module.EditorialMotionController);

/** Shared native gate keeps anchors/focus immediate and first-frame JS small. */
export function EditorialMotion() {
  return useDeferredSceneController('[data-editorial],#contacto', loadController, undefined, 'editorialLayoutReady');
}
