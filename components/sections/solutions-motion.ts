import '@/styles/solutions-full.css';
import { loadGSAP } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

export interface PreviewPoint { x: number; y: number; }
export interface SolutionsAnimator {
  preview: (row: HTMLElement | null, point?: PreviewPoint) => void;
  move: (point: PreviewPoint) => void;
  refresh: () => void;
  dispose: () => void;
}

const idle: SolutionsAnimator = { preview: () => {}, move: () => {}, refresh: () => {}, dispose: () => {} };

export async function mountSolutions(root: HTMLElement, tier: MotionTier, signal: AbortSignal): Promise<SolutionsAnimator> {
  const { gsap, ScrollTrigger, syncTriggerCount } = await loadGSAP();
  if (signal.aborted || !root.isConnected || tier === 0) return idle;
  let alive = true;
  let frame = 0;
  let layoutTimer = 0;
  let railProgress = 0;
  let mediaContext: ReturnType<typeof gsap.matchMedia> | undefined;
  let preview: SolutionsAnimator['preview'] = () => {};
  let move: SolutionsAnimator['move'] = () => {};
  const context = gsap.context(() => {}, root);
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.solutions-row'));
  const list = root.querySelector<HTMLElement>('.solutions-list');
  const rail = root.querySelector<HTMLElement>('.solutions-ai-line');
  const exit = root.querySelector<HTMLElement>('.solutions-exit-line');
  const marks = rows.map(row => row.querySelector<HTMLElement>('.solutions-ai-mark'));
  let markThresholds: number[] = [];
  const measureMarks = () => {
    if (!list) return;
    const height = Math.max(1, list.clientHeight);
    markThresholds = rows.map(row => {
      const heading = row.querySelector<HTMLElement>('.solutions-heading');
      return (row.offsetTop + (heading?.offsetTop ?? 0) + (heading?.offsetHeight ?? 0) / 2) / height;
    });
  };
  const paintMarks = (progress: number) => marks.forEach((mark, index) => {
    if (!mark) return;
    const connected = String(progress >= (markThresholds[index] ?? 1));
    if (mark.dataset.connected !== connected) mark.dataset.connected = connected;
  });
  const settledRefresh = () => {
    clearTimeout(layoutTimer);
    if (!alive || signal.aborted || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!alive || signal.aborted) return;
      ScrollTrigger.refresh();
      paintMarks(railProgress);
      window.dispatchEvent(new Event('dos-orillas:refresh'));
    });
  };
  const requestRefresh = () => {
    clearTimeout(layoutTimer);
    // Fallback for an unchanged/zero-duration grid transition; normal panels
    // finish through transitionend and coalesce into one animation frame.
    if (alive && !signal.aborted) layoutTimer = window.setTimeout(settledRefresh, 400);
  };
  const panelSettled = (event: TransitionEvent) => {
    if (event.propertyName === 'grid-template-rows' && event.target instanceof Element && event.target.matches('.solutions-panel')) settledRefresh();
  };
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    clearTimeout(layoutTimer);
    mediaContext?.revert();
    context.revert();
    root.removeEventListener('transitionend', panelSettled);
    ScrollTrigger.removeEventListener('refreshInit', measureMarks);
    marks.forEach(mark => { if (mark) delete mark.dataset.connected; });
    delete root.dataset.servicesMotion;
    delete root.dataset.servicesPreviewMotion;
    syncTriggerCount();
  };

  try {
    context.add(() => {
      rows.forEach((row, index) => {
        // Keep anything already being read visible; only upcoming rows reveal.
        if (row.getBoundingClientRect().top <= innerHeight * .8) return;
        const timeline = gsap.timeline({ delay: index * .12, defaults: { duration: .7, ease: 'expo.out' }, scrollTrigger: { trigger: row, start: 'top 80%', once: true } });
        timeline.fromTo(row.querySelector('.solutions-hairline-draw'), { scaleX: 0 }, { scaleX: 1 }, 0)
          .fromTo(row.querySelector('.solutions-name-inner'), { yPercent: 110 }, { yPercent: 0 }, .12)
          .fromTo(row.querySelector('.solutions-number'), { opacity: 0 }, { opacity: 1 }, .24);
      });
      if (list && rail) {
        measureMarks();
        gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 80%', end: 'bottom 45%', scrub: .5, onUpdate: self => { railProgress = self.progress; paintMarks(railProgress); } } });
      }
      if (exit) gsap.fromTo(exit, { scaleX: .12 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'bottom bottom+=20%', end: 'bottom bottom', scrub: .5 } });
      const ai = root.querySelector<HTMLElement>('.solutions-ai-copy');
      if (ai && ai.getBoundingClientRect().top > innerHeight * .8) gsap.fromTo(ai.querySelectorAll('.solutions-ai-text'), { yPercent: 110 }, { yPercent: 0, duration: .7, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: ai, start: 'top 80%', once: true } });


      root.dataset.servicesMotion = 'true';
    });
    root.addEventListener('transitionend', panelSettled);
    ScrollTrigger.addEventListener('refreshInit', measureMarks);
    syncTriggerCount();
    settledRefresh();
    document.fonts.ready.then(settledRefresh).catch(() => {});
  } catch (error) {
    dispose();
    throw error;
  }
  return { preview: (row, point) => preview(row, point), move: point => move(point), refresh: requestRefresh, dispose };
}
