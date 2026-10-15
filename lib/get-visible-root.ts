/** Activity may retain earlier pages in the DOM. Use only at setup/navigation, never a ticker. */
export function getVisibleRoot(selector: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>(selector))
    .find(element => element.getClientRects().length > 0);
}

/** Filter diagram descendants by their scene owner without forcing skipped CV content. */
export function getVisibleSceneElements(selector: string): HTMLElement[] {
  const owners = new Map<HTMLElement, boolean>();
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(element => {
    const owner = element.closest<HTMLElement>('[data-page-pathname],[data-scene]') ?? element;
    if (!owners.has(owner)) owners.set(owner, owner.getClientRects().length > 0);
    return owners.get(owner);
  });
}

/** Owner selection during hydration must not force a layout. Activity hides its
 * retained subtree inline; ordinary scene geometry is left to deferred IO. */
function hasMountedOwner(element: HTMLElement): boolean {
  const owner = element.closest<HTMLElement>('[data-page-pathname],[data-scene]') ?? element;
  for (let current: HTMLElement | null = owner; current; current = current.parentElement) {
    if (current.hidden || current.style.display === 'none') return false;
  }
  return true;
}

export function getMountedSceneRoot(selector: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(hasMountedOwner);
}

export function getMountedSceneElements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(hasMountedOwner);
}
