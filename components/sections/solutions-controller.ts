import type { MotionTier } from '@/hooks/useMotionTier';
import type { SolutionsAnimator, PreviewPoint } from './solutions-motion';

export function mountSolutionsController(root: HTMLElement, tier: MotionTier) {
const restoredScroll = window.scrollY > 0;
const rows = Array.from(root.querySelectorAll<HTMLElement>('.solutions-row'));
const buttons = rows.map(row => row.querySelector<HTMLButtonElement>('.solutions-trigger')!);
const panels = rows.map(row => row.querySelector<HTMLElement>('.solutions-panel')!);
const narrow = matchMedia('(max-width: 1023px)');
const fine = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
const controller = new AbortController();
let disposed = false;
let openIndex: number | null = 0;
let hovered: HTMLElement | null = null;
let focused: HTMLElement | null = null;
let dismissed: HTMLElement | null = null;
let active: HTMLElement | null = null;
let point: PreviewPoint | undefined;
let animator: SolutionsAnimator | undefined;
let observer: IntersectionObserver | undefined;
let requested = false;
let firstLayoutFrame = 0;
let settledLayoutFrame = 0;

const setActive = () => {
  const next = fine.matches ? hovered ?? focused : null;
  const visible = next !== dismissed ? next : null;
  if (visible === active) return;
  rows.forEach(row => { if (row === visible) row.dataset.active = 'true'; else delete row.dataset.active; });
  active = visible;
  root.dataset.servicesActive = String(Boolean(active));
  animator?.preview(active, point);
};
const updatePanels = () => {
  panels.forEach((panel, index) => {
    const expanded = !narrow.matches || index === openIndex;
    panel.dataset.open = String(expanded);
    panel.inert = !expanded;
    if (expanded) panel.removeAttribute('aria-hidden');
    else panel.setAttribute('aria-hidden', 'true');
    buttons[index]?.setAttribute('aria-expanded', String(expanded));
  });
  animator?.refresh();
};
const updateMode = () => {
  const interactive = narrow.matches || fine.matches;
  buttons.forEach(button => {
    button.tabIndex = interactive ? 0 : -1;
    if (interactive) button.removeAttribute('aria-disabled');
    else button.setAttribute('aria-disabled', 'true');
  });
  root.dataset.servicesCollapsible = String(narrow.matches);
  hovered = null;
  focused = root.querySelector<HTMLElement>('.solutions-row:focus-within');
  dismissed = null;
  point = undefined;
  updatePanels();
  setActive();
};
const getRow = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('.solutions-row') : null;
const click = (event: MouseEvent) => {
  if (!narrow.matches) return;
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.solutions-trigger') : null;
  const index = button ? buttons.indexOf(button) : -1;
  if (index < 0) return;
  openIndex = openIndex === index ? null : index;
  updatePanels();
};
const dismissPreview = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !active) return;
  dismissed = active;
  setActive();
};
const keydown = (event: KeyboardEvent) => {
  if (!narrow.matches || !(event.target instanceof HTMLButtonElement)) return;
  const index = buttons.indexOf(event.target);
  if (index < 0) return;
  let next: number;
  if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
  else if (event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = buttons.length - 1;
  else return;
  event.preventDefault();
  buttons[next]?.focus();
};
const pointerover = (event: PointerEvent) => {
  if (!fine.matches || event.pointerType === 'touch') return;
  const row = getRow(event.target);
  if (!row || row === getRow(event.relatedTarget)) return;
  hovered = row;
  dismissed = null;
  point = { x: event.clientX, y: event.clientY };
  setActive();
};
const pointerout = (event: PointerEvent) => {
  const row = getRow(event.target);
  if (!row || row === getRow(event.relatedTarget) || row !== hovered) return;
  hovered = null;
  point = undefined;
  setActive();
};
const pointermove = (event: PointerEvent) => {
  if (!fine.matches || event.pointerType === 'touch' || !active || !hovered) return;
  point = { x: event.clientX, y: event.clientY };
  animator?.move(point);
};
const focusin = (event: FocusEvent) => {
  focused = getRow(event.target);
  dismissed = null;
  if (!hovered) point = undefined;
  setActive();
};
const focusout = (event: FocusEvent) => {
  focused = getRow(event.relatedTarget);
  setActive();
};
const requestMotion = () => {
  if (requested || disposed) return;
  requested = true;
  observer?.disconnect();
  const load = tier === 1
    ? import('./solutions-lite').then(({ mountSolutionsLite }) => (signal: AbortSignal) => mountSolutionsLite(root, signal))
    : import('./solutions-motion').then(({ mountSolutions }) => (signal: AbortSignal) => mountSolutions(root, tier, signal));
  void load.then(async mount => {
    if (disposed || controller.signal.aborted) return;
    const mounted = await mount(controller.signal);
    if (disposed || controller.signal.aborted) mounted.dispose();
    else { animator = mounted; animator.preview(active, point); }
  }).catch(() => {
    // The already-bound accordion and static preview remain usable.
  });
};
const firstScroll = () => {
  window.removeEventListener('scroll', firstScroll);
  if (disposed) return;
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) requestMotion();
  }, { rootMargin: '400px 0px' });
  observer.observe(root);
};

root.addEventListener('click', click);
root.addEventListener('keydown', keydown);
window.addEventListener('keydown', dismissPreview);
root.addEventListener('pointerover', pointerover);
root.addEventListener('pointerout', pointerout);
root.addEventListener('pointermove', pointermove, { passive: true });
root.addEventListener('focusin', focusin);
root.addEventListener('focusout', focusout);
narrow.addEventListener('change', updateMode);
fine.addEventListener('change', updateMode);
// Never collapse SSR content before its native handlers exist.
updateMode();
root.dataset.servicesEnhanced = 'true';
// The SSR-to-accordion change is setup, not a user-requested transition. Commit
// its final height before enabling animation and publishing settled geometry.
firstLayoutFrame = requestAnimationFrame(() => {
  firstLayoutFrame = 0;
  settledLayoutFrame = requestAnimationFrame(() => {
    settledLayoutFrame = 0;
    if (disposed) return;
    root.dataset.servicesTransitions = 'true';
    window.dispatchEvent(new Event('dos-orillas:services-ready'));
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  });
});
window.addEventListener('scroll', firstScroll, { passive: true, once: true });
// Explicit hash navigation can restore the section before hydration's listener.
if (location.hash || restoredScroll) firstScroll();
return () => {
  disposed = true;
  controller.abort();
  cancelAnimationFrame(firstLayoutFrame);
  cancelAnimationFrame(settledLayoutFrame);
  observer?.disconnect();
  window.removeEventListener('scroll', firstScroll);
  animator?.dispose();
  root.removeEventListener('click', click);
  root.removeEventListener('keydown', keydown);
  window.removeEventListener('keydown', dismissPreview);
  root.removeEventListener('pointerover', pointerover);
  root.removeEventListener('pointerout', pointerout);
  root.removeEventListener('pointermove', pointermove);
  root.removeEventListener('focusin', focusin);
  root.removeEventListener('focusout', focusout);
  narrow.removeEventListener('change', updateMode);
  fine.removeEventListener('change', updateMode);
  rows.forEach(row => { delete row.dataset.active; });
  panels.forEach((panel, index) => {
    delete panel.dataset.open;
    panel.inert = false;
    panel.removeAttribute('aria-hidden');
    const button = buttons[index];
    if (button) {
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-disabled', 'true');
      button.tabIndex = -1;
    }
  });
  delete root.dataset.servicesEnhanced;
  delete root.dataset.servicesTransitions;
  delete root.dataset.servicesCollapsible;
  delete root.dataset.servicesActive;
};
}
