import '@/styles/process-full.css';
import { loadGSAP, loadOptionalPlugin } from '@/lib/gsap';

interface ProcessGeometry {
  distance: number;
  stageWidth: number;
  centers: number[];
}
export interface ProcessMountResult {
  fits: boolean;
  dispose: () => void;
}

/** All dimensions are read during setup/refresh, never on a scroll update. */
function measure(track: HTMLElement, stage: HTMLElement, list: HTMLOListElement, steps: HTMLElement[]): ProcessGeometry {
  return {
    distance: Math.max(1, track.scrollWidth - stage.clientWidth),
    stageWidth: stage.clientWidth,
    centers: steps.map(step => list.offsetLeft + list.parentElement!.offsetLeft + step.offsetLeft + step.offsetWidth / 2),
  };
}

export async function mountProcessScene(root: HTMLElement, signal: AbortSignal): Promise<ProcessMountResult> {
  const { gsap, ScrollTrigger, syncTriggerCount } = await loadGSAP();
  if (signal.aborted || !root.isConnected) return { fits: false, dispose: () => {} };
  // This plugin is imported only on the full horizontal journey, near this scene.
  await loadOptionalPlugin('MotionPathPlugin');
  if (signal.aborted || !root.isConnected) return { fits: false, dispose: () => {} };
  const stage = root.querySelector<HTMLElement>('.process-stage');
  const track = root.querySelector<HTMLElement>('.process-track');
  const list = root.querySelector<HTMLOListElement>('.process-steps');
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-process-step]'));
  if (!stage || !track || !list || !steps.length) return { fits: false, dispose: () => {} };
  const originalHeight = root.style.height;
  const originalWillChange = track.style.willChange;
  const progressFill = root.querySelector<HTMLElement>('.process-progress-fill');
  const originalFillTransform = progressFill?.style.transform ?? '';
  const previousMode = root.dataset.processMode ?? 'flow';
  root.dataset.processMode = 'horizontal';
  delete root.dataset.processTextFlow;
  const availableHeight = track.clientHeight;
  const panels = [root.querySelector<HTMLElement>('.process-opening'), ...steps];
  const fits = panels.every(panel => panel && panel.scrollHeight <= availableHeight + 3 && panel.scrollWidth <= panel.clientWidth + 3);
  if (!fits) {
    root.dataset.processMode = previousMode;
    return { fits: false, dispose: () => {} };
  }
  let geometry = measure(track, stage, list, steps);
  root.style.height = `${stage.clientHeight + geometry.distance}px`;
  const context = gsap.context(() => {}, root);
  let alive = true;
  let fontFrame = 0;
  let removeFocusListener = () => {};
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(fontFrame);
    signal.removeEventListener('abort', dispose);
    removeFocusListener();
    context.revert();
    if (progressFill) {
      if (originalFillTransform) progressFill.style.transform = originalFillTransform;
      else progressFill.style.removeProperty('transform');
    }
    root.style.height = originalHeight;
    track.style.willChange = originalWillChange;
    root.dataset.processMode = 'flow';
    root.dataset.processIndex = '0';
    delete root.dataset.processReady;
    root.querySelectorAll<HTMLElement>('[data-process-mark]').forEach(mark => { mark.dataset.passed = 'true'; });
    if (window.__sceneRanges) delete window.__sceneRanges.process;
    syncTriggerCount();
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  signal.addEventListener('abort', dispose, { once: true });

  try {
    context.add(() => {
      const fill = root.querySelector<HTMLElement>('.process-progress-fill');
      const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-process-mark]'));
      const roll = root.querySelector<HTMLElement>('.process-counter-roll');
      const setFill = fill ? gsap.quickSetter(fill, 'scaleX') : () => {};
      const rollTo = roll ? gsap.quickTo(roll, 'yPercent', { duration: .32, ease: 'power3.out' }) : () => {};
      let currentIndex = -1;
      const update = (progress: number) => {
        if (!alive) return;
        setFill(progress);
        const visibleCenter = progress * geometry.distance + geometry.stageWidth / 2;
        let nextIndex = 0;
        let nearest = Infinity;
        geometry.centers.forEach((center, index) => {
          const delta = Math.abs(center - visibleCenter);
          if (delta < nearest) { nearest = delta; nextIndex = index; }
        });
        if (nextIndex === currentIndex) return;
        currentIndex = nextIndex;
        root.dataset.processIndex = String(nextIndex);
        rollTo(-nextIndex * 100 / steps.length);
        marks.forEach((mark, index) => { mark.dataset.passed = String(index <= nextIndex); });
      };
      const publish = (start: number, end: number) => {
        window.__sceneRanges ??= {};
        window.__sceneRanges.process = { start, end };
        syncTriggerCount();
      };
      const horizontal = gsap.to(track, {
        x: () => -geometry.distance,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${geometry.distance}`,
          pin: stage,
          pinSpacing: false,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: new URLSearchParams(location.search).has('debug'),
          onRefreshInit: () => {
            geometry = measure(track, stage, list, steps);
            root.style.height = `${stage.clientHeight + geometry.distance}px`;
          },
          onRefresh: trigger => { publish(trigger.start, trigger.end); update(trigger.progress); },
          onUpdate: trigger => update(trigger.progress),
          onToggle: trigger => { track.style.willChange = trigger.isActive ? 'transform' : originalWillChange; },
        },
      });
      steps.forEach(step => {
        const diagram = step.querySelector<SVGSVGElement>('.process-diagram');
        if (!diagram) return;
        const timeline = gsap.timeline({ scrollTrigger: {
          trigger: step,
          containerAnimation: horizontal,
          start: 'left 85%',
          end: 'right 15%',
          scrub: true,
          invalidateOnRefresh: true,
        } });
        timeline.fromTo(step, { opacity: .68 }, { opacity: 1, duration: .35, ease: 'none' }, 0)
          .to(step, { opacity: .68, duration: .35, ease: 'none' }, .65);
        const origin = diagram.querySelector('.process-origin');
        const destination = diagram.querySelector('.process-destination');
        const trace = diagram.querySelector('.process-trace');
        const visual = diagram.dataset.processDiagram;
        if (visual === 'separate') {
          timeline.fromTo(origin, { x: 32 }, { x: 0, duration: .36, ease: 'power2.inOut' }, .04)
            .fromTo(destination, { x: -32 }, { x: 0, duration: .36, ease: 'power2.inOut' }, .04)
            .fromTo(trace, { opacity: .15 }, { opacity: .5, duration: .32 }, .04);
        } else if (visual === 'think') {
          timeline.fromTo(diagram.querySelector('.process-construction'), { opacity: .0, scale: .95, transformOrigin: '50% 50%' }, { opacity: .3, scale: 1, duration: .34 }, .04)
            .fromTo(diagram.querySelector('.process-measure-marks'), { opacity: 0, scaleY: 0, transformOrigin: '50% 50%' }, { opacity: .65, scaleY: 1, duration: .28 }, .12);
        } else if (visual === 'build') {
          timeline.fromTo(diagram.querySelectorAll('.process-block'), { x: index => index % 2 ? 52 : -52, opacity: .2 }, { x: 0, opacity: 1, duration: .28, stagger: .06, ease: 'power2.inOut' }, .04);
        } else {
          timeline.fromTo(trace, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: .18, ease: 'none' }, .01)
            .to(diagram.querySelector('.process-traveler'), { motionPath: { path: [{ x: 0, y: 0 }, { x: 420, y: 0 }] }, duration: .22, ease: 'none' }, .18)
            .fromTo(diagram.querySelector('.process-pulse'), { scale: .6, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1.15, opacity: .7, duration: .04 }, .40)
            .to(diagram.querySelector('.process-pulse'), { scale: 1.4, opacity: 0, duration: .05 }, .44);
        }
      });
      const focus = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        const focusedStep = event.target.closest<HTMLElement>('[data-process-step]');
        if (!focusedStep || !horizontal.scrollTrigger) return;
        const index = steps.indexOf(focusedStep);
        if (index < 0) return;
        const progress = Math.max(0, Math.min(1, ((geometry.centers[index] ?? 0) - geometry.stageWidth / 2) / geometry.distance));
        const trigger = horizontal.scrollTrigger;
        const destination = trigger.start + progress * (trigger.end - trigger.start);
        if (window.__lenis) window.__lenis.scrollTo(destination, { duration: .55, force: true });
        else window.scrollTo({ top: destination, behavior: 'smooth' });
      };
      root.addEventListener('focusin', focus);
      removeFocusListener = () => root.removeEventListener('focusin', focus);
      root.dataset.processReady = 'true';
      syncTriggerCount();
      if (horizontal.scrollTrigger) update(horizontal.scrollTrigger.progress);
    });
    document.fonts.ready.then(() => {
      if (!alive) return;
      fontFrame = requestAnimationFrame(() => {
        fontFrame = 0;
        if (alive) { ScrollTrigger.refresh(); window.dispatchEvent(new Event('dos-orillas:refresh')); }
      });
    }).catch(() => {});
    window.dispatchEvent(new Event('dos-orillas:refresh'));
    return { fits: true, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
