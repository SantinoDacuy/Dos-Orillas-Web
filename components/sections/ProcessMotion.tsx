'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

/** Vertical motion uses native scroll plus cached geometry, without GSAP. */
function mountVertical(root: HTMLElement) {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-process-step]'));
  const fill = root.querySelector<HTMLElement>('.process-vertical-fill');
  const horizontalFill = root.querySelector<HTMLElement>('.process-progress-fill');
  const roll = root.querySelector<HTMLElement>('.process-counter-roll');
  const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-process-mark]'));
  let frame = 0;
  let measureFrame = 0;
  let alive = true;
  let centers: number[] = [];
  let start = 0;
  let end = 1;
  let currentIndex = -1;
  const animations: Animation[] = [];
  root.dataset.processMode = 'vertical';

  const update = () => {
    frame = 0;
    if (!alive) return;
    const position = window.scrollY;
    const progress = clamp((position - start) / Math.max(1, end - start));
    if (fill) fill.style.transform = `scaleY(${progress})`;
    if (horizontalFill) horizontalFill.style.transform = `scaleX(${progress})`;
    const viewportCenter = position + innerHeight / 2;
    let nextIndex = 0;
    let nearest = Infinity;
    centers.forEach((center, index) => {
      const delta = Math.abs(center - viewportCenter);
      if (delta < nearest) { nearest = delta; nextIndex = index; }
    });
    if (nextIndex === currentIndex) return;
    currentIndex = nextIndex;
    root.dataset.processIndex = String(nextIndex);
    if (roll) roll.style.transform = `translateY(-${nextIndex * 1.5}em)`;
    marks.forEach((mark, index) => { mark.dataset.passed = String(index <= nextIndex); });
  };
  const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(update); };
  const measure = () => {
    measureFrame = 0;
    if (!alive) return;
    centers = steps.map(step => {
      const box = step.getBoundingClientRect();
      return window.scrollY + box.top + box.height / 2;
    });
    start = (centers[0] ?? 0) - innerHeight / 2;
    end = (centers[centers.length - 1] ?? start + 1) - innerHeight / 2;
    schedule();
  };
  const scheduleMeasure = () => { if (alive && !measureFrame) measureFrame = requestAnimationFrame(measure); };
  const resize = new ResizeObserver(scheduleMeasure);
  steps.forEach(step => resize.observe(step));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('dos-orillas:refresh', scheduleMeasure);
  document.fonts.ready.then(scheduleMeasure).catch(() => {});
  scheduleMeasure();

  // Reveal only forthcoming content. Existing readable content never disappears.
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
      const targets = entry.target.querySelectorAll<HTMLElement | SVGSVGElement>('.process-step-copy,.process-diagram');
      targets.forEach((target, index) => {
        const animation = target.animate([{ transform: 'translateY(18px)', opacity: .45 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 650, delay: index * 70, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'none' });
        animations.push(animation);
      });
      reveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  steps.forEach(step => { if (step.getBoundingClientRect().top >= innerHeight) reveal.observe(step); });

  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    resize.disconnect();
    reveal.disconnect();
    animations.forEach(animation => animation.cancel());
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', scheduleMeasure);
    window.removeEventListener('dos-orillas:refresh', scheduleMeasure);
    fill?.style.removeProperty('transform');
    horizontalFill?.style.removeProperty('transform');
    roll?.style.removeProperty('transform');
    marks.forEach(mark => { mark.dataset.passed = 'true'; });
    root.dataset.processMode = 'flow';
    root.dataset.processIndex = '0';
  };
}

function horizontalFits(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('.process-track');
  if (!track) return false;
  const availableHeight = track.clientHeight;
  const panels = root.querySelectorAll<HTMLElement>('.process-opening,.process-step');
  return Array.from(panels).every(panel => panel.scrollHeight <= availableHeight + 3 && panel.scrollWidth <= panel.clientWidth + 3);
}

/** Every semantic element is server-rendered; this island only adds motion. */
export function ProcessMotion() {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready) return;
    const root = document.querySelector<HTMLElement>('[data-scene="process"]');
    if (!root) return;
    if (tier === 0) {
      root.dataset.processMode = 'flow';
      return;
    }
    let alive = true;
    let started = false;
    let near = false;
    let crowded = false;
    let frame = 0;
    let viewport = '';
    let profile = '';
    let textProfile = '';
    let textCrowded = false;
    let disposeMotion = () => {};
    let controller: AbortController | undefined;
    let nearObserver: IntersectionObserver | undefined;
    let resize: ResizeObserver | undefined;
    const wide = matchMedia('(min-width: 1024px)');
    const short = matchMedia('(min-width: 1024px) and (max-height: 739px)');

    const update = () => {
      frame = 0;
      if (!alive || !near) return;
      const nextViewport = `${innerWidth}:${innerHeight}`;
      if (nextViewport !== viewport) { viewport = nextViewport; crowded = false; }
      if (root.dataset.processMode === 'horizontal' && !horizontalFits(root)) crowded = true;
      const nextProfile = tier >= 2 && wide.matches ? (short.matches || crowded ? 'flow' : 'horizontal') : 'vertical';
      if (nextProfile !== profile) {
        profile = nextProfile;
        controller?.abort();
        disposeMotion();
        disposeMotion = () => {};
        root.dataset.processMode = 'flow';
        if (nextProfile === 'horizontal') {
          const abort = controller = new AbortController();
          void import('./process-timelines').then(async ({ mountProcessScene }) => {
            if (!alive || abort.signal.aborted) return;
            const result = await mountProcessScene(root, abort.signal);
            if (!alive || abort.signal.aborted) result.dispose();
            else {
              disposeMotion = result.dispose;
              if (!result.fits) { crowded = true; schedule(); }
            }
          }).catch(() => {
            if (!alive || abort.signal.aborted) return;
            crowded = true;
            root.dataset.processMode = 'flow';
            schedule();
          });
        } else if (nextProfile === 'vertical') disposeMotion = mountVertical(root);
      }
      // A larger real font can exceed a narrow numeral column even when viewport
      // dimensions do not change. Stack those blocks rather than overlap text.
      if (root.dataset.processMode !== 'horizontal') {
        const titles = Array.from(root.querySelectorAll<HTMLElement>('.process-step-title'));
        const sizes = titles.map(title => parseFloat(getComputedStyle(title).fontSize));
        const nextTextProfile = `${innerWidth}:${innerHeight}:${sizes.join(':')}`;
        if (textProfile !== nextTextProfile) {
          textProfile = nextTextProfile;
          textCrowded = false;
          delete root.dataset.processTextFlow;
        }
        // Flow itself widens the copy column. Once chosen, keep it until the
        // viewport or actual font size changes, rather than oscillating in RO.
        if (!textCrowded) textCrowded = titles.some((title, index) => {
          const size = sizes[index] ?? 0;
          return size > 76 || (size > 48 && title.clientWidth < 220);
        });
        if (root.dataset.processTextFlow !== String(textCrowded)) root.dataset.processTextFlow = String(textCrowded);
      } else delete root.dataset.processTextFlow;
    };
    const schedule = () => { if (alive && near && !frame) frame = requestAnimationFrame(update); };
    const observeLayout = () => {
      if (!alive || near) return;
      near = true;
      nearObserver?.disconnect();
      resize = new ResizeObserver(schedule);
      root.querySelectorAll<HTMLElement>('.process-stage,.process-opening-statement,.process-step,.process-step-copy,.process-step-number').forEach(element => resize?.observe(element));
      wide.addEventListener('change', schedule);
      short.addEventListener('change', schedule);
      window.addEventListener('resize', schedule, { passive: true });
      document.fonts.ready.then(schedule).catch(() => {});
      schedule();
    };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      window.removeEventListener('scroll', begin);
      nearObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) observeLayout();
      }, { rootMargin: '800px 0px' });
      nearObserver.observe(root);
    };
    window.addEventListener('scroll', begin, { passive: true, once: true });
    if (window.scrollY > 0) begin();
    return () => {
      alive = false;
      controller?.abort();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', begin);
      nearObserver?.disconnect();
      resize?.disconnect();
      wide.removeEventListener('change', schedule);
      short.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
      disposeMotion();
      root.dataset.processMode = 'flow';
      root.dataset.processIndex = '0';
      delete root.dataset.processTextFlow;
    };
  }, [tier, ready]);
  return null;
}
