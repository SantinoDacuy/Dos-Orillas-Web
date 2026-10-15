import { motionCssEase } from '@/lib/motion-tokens';
import type { SolutionsAnimator } from './solutions-motion';

const idle: SolutionsAnimator = { preview: () => {}, move: () => {}, refresh: () => {}, dispose: () => {} };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Tier1 owns native motion only. The controller keeps every accordion handler.
 * The deferred owner must set data-narrative-layout-ready before calling this. */
export function mountSolutionsLite(root: HTMLElement, signal: AbortSignal): SolutionsAnimator {
  if (signal.aborted || !root.isConnected) return idle;
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.solutions-row'));
  const list = root.querySelector<HTMLElement>('.solutions-list');
  const rail = root.querySelector<HTMLElement>('.solutions-ai-line');
  const exit = root.querySelector<HTMLElement>('.solutions-exit-line');
  const ai = root.querySelector<HTMLElement>('.solutions-ai');
  const marks = rows.map(row => row.querySelector<HTMLElement>('.solutions-ai-mark'));
  const animations: Animation[] = [];
  const pending = new Map<Element, Animation[]>();
  const transforms = new Map<HTMLElement, { value: string; priority: string }>();
  const attributes = new Map<Element, Map<string, string | null>>();
  let alive = true;
  let paintFrame = 0;
  let measureFrame = 0;
  let layoutTimer = 0;
  let resizeTimer = 0;
  let emittingRefresh = false;
  let broadcastPending = false;
  let revealedPrepared = false;
  let start = 0;
  let end = 1;
  let exitStart = 0;
  let exitTravel = 1;
  let thresholds: number[] = [];
  let previousRail = -1;
  let previousExit = -1;
  let resize: ResizeObserver | undefined;
  let reveal: IntersectionObserver | undefined;

  const rememberAttribute = (element: Element, name: string) => {
    let stored = attributes.get(element);
    if (!stored) { stored = new Map(); attributes.set(element, stored); }
    if (!stored.has(name)) stored.set(name, element.getAttribute(name));
  };
  const rememberTransform = (element: HTMLElement | null) => {
    if (element && !transforms.has(element)) transforms.set(element, {
      value: element.style.getPropertyValue('transform'), priority: element.style.getPropertyPriority('transform'),
    });
  };
  rememberTransform(rail);
  rememberTransform(exit);
  rememberAttribute(root, 'data-services-motion');
  rememberAttribute(root, 'data-services-motion-mode');
  marks.forEach(mark => { if (mark) rememberAttribute(mark, 'data-connected'); });

  const paint = () => {
    paintFrame = 0;
    if (!alive || signal.aborted) return;
    const y = window.scrollY;
    const progress = clamp((y - start) / Math.max(1, end - start));
    const exitProgress = clamp((y - exitStart) / Math.max(1, exitTravel));
    if (rail && Math.abs(progress - previousRail) > .0001) {
      rail.style.transform = `scaleY(${progress})`;
      previousRail = progress;
    }
    if (exit && Math.abs(exitProgress - previousExit) > .0001) {
      exit.style.transform = `scaleX(${exitProgress})`;
      previousExit = exitProgress;
    }
    marks.forEach((mark, index) => {
      if (!mark) return;
      const connected = String(progress >= (thresholds[index] ?? 1));
      if (mark.dataset.connected !== connected) mark.dataset.connected = connected;
    });
  };
  const schedulePaint = () => { if (alive && !paintFrame) paintFrame = requestAnimationFrame(paint); };

  const queueReveal = (trigger: HTMLElement, targets: Array<{ element: HTMLElement; keyframes: Keyframe[]; delay: number }>) => {
    if (!reveal || targets.length === 0) return;
    const group: Animation[] = [];
    for (const { element, keyframes, delay } of targets) {
      if (typeof element.animate !== 'function') continue;
      const animation = element.animate(keyframes, { duration: 700, delay, easing: motionCssEase.out, fill: 'both' });
      animation.pause();
      animation.currentTime = 0;
      // The CSS remains the final state; cancel removes the finished effect.
      animation.onfinish = () => animation.cancel();
      group.push(animation);
      animations.push(animation);
    }
    if (group.length) { pending.set(trigger, group); reveal.observe(trigger); }
  };

  const measure = () => {
    measureFrame = 0;
    if (!alive || signal.aborted) return;
    const y = window.scrollY;
    // All geometry is read together, only after the deferred owner unlocked CV.
    const listRect = list?.getBoundingClientRect();
    const rowRects = rows.map(row => row.getBoundingClientRect());
    const headingRects = rows.map(row => row.querySelector<HTMLElement>('.solutions-heading')?.getBoundingClientRect());
    const exitRect = exit?.getBoundingClientRect();
    const aiRect = ai?.getBoundingClientRect();
    if (listRect) {
      const height = Math.max(1, listRect.height);
      start = y + listRect.top - innerHeight * .65;
      end = y + listRect.bottom - innerHeight * .5;
      thresholds = headingRects.map((heading, index) => {
        const rect = heading ?? rowRects[index];
        return rect ? clamp((rect.top + rect.height / 2 - listRect.top) / height) : 1;
      });
    }
    if (exitRect) {
      exitStart = y + exitRect.top - innerHeight * .85;
      exitTravel = Math.max(1, innerHeight * .3);
    }
    if (!revealedPrepared) {
      revealedPrepared = true;
      rows.forEach((row, index) => {
        if ((rowRects[index]?.top ?? 0) <= innerHeight * .8) return;
        const number = row.querySelector<HTMLElement>('.solutions-number');
        const line = row.querySelector<HTMLElement>('.solutions-hairline-draw');
        const targets: Array<{ element: HTMLElement; keyframes: Keyframe[]; delay: number }> = [];
        // Names/descriptions remain readable. These two targets are decorative.
        if (number) targets.push({ element: number, keyframes: [{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], delay: index * 120 });
        if (line) targets.push({ element: line, keyframes: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], delay: index * 120 });
        queueReveal(row, targets);
      });
      if (ai && aiRect && aiRect.top > innerHeight * .8) queueReveal(ai,
        Array.from(ai.querySelectorAll<HTMLElement>('.solutions-ai-text')).map((element, index) => ({
          element, keyframes: [{ transform: 'translateY(110%)' }, { transform: 'none' }], delay: index * 120,
        })));
    }
    schedulePaint();
    if (broadcastPending) {
      broadcastPending = false;
      // Other controllers may cache this section's height. Ignore our own event
      // so one accordion transition cannot recursively schedule measurements.
      emittingRefresh = true;
      try { window.dispatchEvent(new Event('dos-orillas:refresh')); }
      finally { emittingRefresh = false; }
    }
  };
  const scheduleMeasure = (broadcast = false) => {
    if (!alive || signal.aborted) return;
    broadcastPending ||= broadcast;
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  };
  const settledMeasure = () => {
    clearTimeout(layoutTimer);
    clearTimeout(resizeTimer);
    scheduleMeasure(true);
  };
  const requestRefresh = () => {
    clearTimeout(layoutTimer);
    if (alive && !signal.aborted) layoutTimer = window.setTimeout(settledMeasure, 400);
  };
  const resized = () => {
    clearTimeout(resizeTimer);
    // RO sees each grid transition frame; read only after its height settles.
    if (alive && !signal.aborted) resizeTimer = window.setTimeout(settledMeasure, 110);
  };
  const refreshed = () => { if (!emittingRefresh) scheduleMeasure(); };
  const panelSettled = (event: TransitionEvent) => {
    if (event.propertyName === 'grid-template-rows' && event.target instanceof Element && event.target.matches('.solutions-panel')) settledMeasure();
  };
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(paintFrame);
    cancelAnimationFrame(measureFrame);
    clearTimeout(layoutTimer);
    clearTimeout(resizeTimer);
    resize?.disconnect();
    reveal?.disconnect();
    animations.forEach(animation => { animation.onfinish = null; animation.cancel(); });
    pending.clear();
    window.removeEventListener('scroll', schedulePaint);
    window.removeEventListener('resize', resized);
    window.removeEventListener('dos-orillas:refresh', refreshed);
    root.removeEventListener('transitionend', panelSettled);
    signal.removeEventListener('abort', dispose);
    transforms.forEach(({ value, priority }, element) => {
      if (value) element.style.setProperty('transform', value, priority);
      else element.style.removeProperty('transform');
    });
    attributes.forEach((stored, element) => stored.forEach((value, name) => {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }));
  };

  try {
    if ('IntersectionObserver' in window) reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        pending.get(entry.target)?.forEach(animation => animation.play());
        pending.delete(entry.target);
        reveal?.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -20% 0px' });
    if ('ResizeObserver' in window) {
      resize = new ResizeObserver(resized);
      resize.observe(root);
      if (list) resize.observe(list);
    }
    root.dataset.servicesMotion = 'true';
    root.dataset.servicesMotionMode = 'lite';
    window.addEventListener('scroll', schedulePaint, { passive: true });
    window.addEventListener('resize', resized, { passive: true });
    window.addEventListener('dos-orillas:refresh', refreshed);
    root.addEventListener('transitionend', panelSettled);
    signal.addEventListener('abort', dispose, { once: true });
    void document.fonts.ready.then(() => { if (alive && !signal.aborted) scheduleMeasure(true); }).catch(() => {});
    scheduleMeasure();
    // In lite, CSS/the controller already displays the active preview and the
    // mobile panel media. No pointer handlers or transforms are added here.
    return { preview: () => {}, move: () => {}, refresh: requestRefresh, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
