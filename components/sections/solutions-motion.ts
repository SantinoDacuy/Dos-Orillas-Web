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

      if (tier >= 2) {
        mediaContext = gsap.matchMedia();
        mediaContext.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
          root.dataset.servicesPreviewMotion = 'true';
          const items = rows.map(row => {
            const node = row.querySelector<HTMLElement>('.solutions-media')!;
            const previousAria = node.getAttribute('aria-hidden');
            node.setAttribute('aria-hidden', 'true');
            const reveal = gsap.timeline({ paused: true }).fromTo(node, { clipPath: 'inset(50% 0 50% 0)', scale: .9, opacity: 0 }, { clipPath: 'inset(0)', scale: 1, opacity: 1, duration: .45, ease: 'power3.out' });
            reveal.eventCallback('onReverseComplete', () => { delete node.dataset.previewVisible; });
            return { row, node, previousAria, reveal, xTo: gsap.quickTo(node, 'x', { duration: .5, ease: 'power3.out' }), yTo: gsap.quickTo(node, 'y', { duration: .5, ease: 'power3.out' }), rotateTo: gsap.quickTo(node, 'rotation', { duration: .5, ease: 'power3.out' }) };
          });
          let current: typeof items[number] | undefined;
          let width = 0;
          let height = 0;
          let viewportWidth = innerWidth;
          let viewportHeight = innerHeight;
          let lastX: number | null = null;
          let resetRotation = 0;
          const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(Math.max(minimum, maximum), value));
          const position = (point?: PreviewPoint, immediately = false) => {
            if (!current) return;
            // Reserve the left copy column; the image follows only 22% in X.
            const x = clamp(viewportWidth * .68 + ((point?.x ?? viewportWidth * .68) - viewportWidth * .68) * .22, 32, viewportWidth - width - 32);
            const y = clamp((point?.y ?? viewportHeight * .5) - height * .5, 32, viewportHeight - height - 32);
            if (immediately) { current.xTo.tween.pause(); current.yTo.tween.pause(); gsap.set(current.node, { x, y }); }
            else { current.xTo(x); current.yTo(y); }
          };
          preview = (row, point) => {
            const next = items.find(item => item.row === row);
            if (next === current) return;
            current?.reveal.reverse();
            current?.rotateTo(0);
            clearTimeout(resetRotation);
            current = next;
            lastX = point?.x ?? null;
            if (!current) return;
            current.node.dataset.previewVisible = 'true';
            // Read once per activation, never during a pointer-move tick.
            width = current.node.offsetWidth;
            height = current.node.offsetHeight;
            viewportWidth = innerWidth;
            viewportHeight = innerHeight;
            if (!point) {
              const rowBounds = current.row.getBoundingClientRect();
              point = { x: viewportWidth * .68, y: rowBounds.top + rowBounds.height / 2 };
            }
            position(point, true);
            current.reveal.play();
          };
          move = point => {
            if (!current) return;
            position(point);
            const dx = lastX === null ? 0 : point.x - lastX;
            lastX = point.x;
            current.rotateTo(clamp(dx * .1, -6, 6));
            clearTimeout(resetRotation);
            resetRotation = window.setTimeout(() => current?.rotateTo(0), 120);
          };
          const resized = () => {
            viewportWidth = innerWidth;
            viewportHeight = innerHeight;
            if (!current) return;
            width = current.node.offsetWidth;
            height = current.node.offsetHeight;
            position(undefined, true);
          };
          window.addEventListener('resize', resized, { passive: true });
          return () => {
            clearTimeout(resetRotation);
            window.removeEventListener('resize', resized);
            preview = () => {};
            move = () => {};
            delete root.dataset.servicesPreviewMotion;
            items.forEach(({ node, previousAria }) => {
              delete node.dataset.previewVisible;
              if (previousAria === null) node.removeAttribute('aria-hidden');
              else node.setAttribute('aria-hidden', previousAria);
            });
          };
        });
      }
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
