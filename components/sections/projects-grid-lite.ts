import { motionCssEase } from '@/lib/motion-tokens';
import type { ProjectGridAnimator } from './projects-grid-motion';

const idle: ProjectGridAnimator = { dispose: () => {} };
interface Reveal {
  trigger: HTMLElement;
  card?: HTMLElement;
  inner?: HTMLElement;
  kind: 'title' | 'image';
  direction: number;
}

/** Owner unlocks data-narrative-layout-ready before calling this. No GSAP/ST. */
export function mountProjectGridLite(root: HTMLElement, signal: AbortSignal): ProjectGridAnimator {
  if (signal.aborted || !root.isConnected || !('IntersectionObserver' in window)) return idle;
  const previousEnhanced = root.getAttribute('data-projects-enhanced');
  const previousMode = root.getAttribute('data-projects-motion-mode');
  const pending = new Map<Element, Reveal>();
  const active = new Map<HTMLElement, Set<Animation>>();
  let alive = true;
  let frame = 0;
  let observer: IntersectionObserver | undefined;

  const finish = (owner: HTMLElement) => {
    for (const [trigger, reveal] of pending) if ((reveal.card ?? reveal.trigger) === owner) {
      observer?.unobserve(trigger);
      pending.delete(trigger);
    }
    const animations = active.get(owner);
    if (!animations) return;
    active.delete(owner);
    animations.forEach(animation => {
      animation.onfinish = null;
      try { animation.finish(); } finally { animation.cancel(); }
    });
  };
  const animate = (reveal: Reveal) => {
    const owner = reveal.card ?? reveal.trigger;
    if (!alive || signal.aborted || owner.matches(':focus-within')) return;
    const animations = new Set<Animation>();
    active.set(owner, animations);
    const start = (element: HTMLElement, keyframes: Keyframe[], duration: number, easing: string) => {
      if (typeof element.animate !== 'function') return;
      const animation = element.animate(keyframes, { duration, easing, fill: 'none' });
      animations.add(animation);
      animation.onfinish = () => {
        animations.delete(animation);
        animation.onfinish = null;
        animation.cancel();
        if (!animations.size) active.delete(owner);
      };
    };
    try {
      if (reveal.kind === 'title') start(reveal.trigger,
        [{ transform: 'translateY(24px)', opacity: .68 }, { transform: 'translateY(0)', opacity: 1 }], 800, motionCssEase.out);
      else {
        start(reveal.trigger, [
          { clipPath: reveal.direction % 2 ? 'inset(0% 0% 0% 100%)' : 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)' },
        ], 1200, motionCssEase.inOut);
        if (reveal.inner) start(reveal.inner, [{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 1600, motionCssEase.out);
      }
      if (!animations.size) active.delete(owner);
    } catch { finish(owner); }
  };
  const observePending = () => {
    frame = 0;
    if (!alive || signal.aborted) return;
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const reveal = pending.get(entry.target);
        if (!reveal) continue;
        pending.delete(entry.target);
        observer?.unobserve(entry.target);
        // Fast jumps/Tab never conceal content already well inside the viewport.
        if (entry.boundingClientRect.top <= innerHeight * .3) continue;
        animate(reveal);
      }
    }, { rootMargin: `0px 0px -${Math.round(innerHeight * .15)}px 0px`, threshold: 0 });
    for (const [trigger, reveal] of pending) {
      const bounds = trigger.getBoundingClientRect();
      if (bounds.top < innerHeight || bounds.bottom <= 0 || (reveal.card ?? trigger).matches(':focus-within')) pending.delete(trigger);
      else observer.observe(trigger);
    }
  };
  const requestObserve = () => { if (alive && !frame) frame = requestAnimationFrame(observePending); };
  const focus = (event: FocusEvent) => {
    const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.project-card') : null;
    if (card && root.contains(card)) finish(card);
  };
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    pending.clear();
    Array.from(active.keys()).forEach(finish);
    root.removeEventListener('focusin', focus);
    window.removeEventListener('resize', requestObserve);
    window.removeEventListener('dos-orillas:refresh', requestObserve);
    signal.removeEventListener('abort', dispose);
    if (previousEnhanced === null) delete root.dataset.projectsEnhanced;
    else root.setAttribute('data-projects-enhanced', previousEnhanced);
    if (previousMode === null) delete root.dataset.projectsMotionMode;
    else root.setAttribute('data-projects-motion-mode', previousMode);
  };
  try {
    const title = root.querySelector<HTMLElement>('.project-grid-title-inner');
    if (title) pending.set(title, { trigger: title, kind: 'title', direction: 0 });
    root.querySelectorAll<HTMLElement>('.project-card').forEach((card, direction) => {
      const trigger = card.querySelector<HTMLElement>('[data-project-reveal]');
      const inner = card.querySelector<HTMLElement>('.project-card-reveal-inner');
      if (trigger && inner) pending.set(trigger, { trigger, inner, card, direction, kind: 'image' });
    });
    root.dataset.projectsEnhanced = 'true';
    root.dataset.projectsMotionMode = 'lite';
    root.addEventListener('focusin', focus);
    window.addEventListener('resize', requestObserve, { passive: true });
    window.addEventListener('dos-orillas:refresh', requestObserve);
    signal.addEventListener('abort', dispose, { once: true });
    observePending();
    document.fonts.ready.then(requestObserve).catch(() => {});
    return { dispose };
  } catch (error) { dispose(); throw error; }
}
