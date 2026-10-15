'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getVisibleRoot } from '@/lib/get-visible-root';

/** Semantic chapters are server content; native state/reveals begin after scroll. */
export function ProjectMotion({ slug }: { slug: string }) {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getVisibleRoot(`[data-project-case="${CSS.escape(slug)}"][data-page-pathname="/projects/${CSS.escape(slug)}"]`);
    if (!root) return;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-project-chapter]'));
    const chapterLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-project-chapter-link]'));
    let alive = true;
    let started = false;
    let runtimeStarted = false;
    let frame = 0;
    let measureFrame = 0;
    let starts: number[] = [];
    let viewport = innerHeight;
    let active = -1;
    let resize: ResizeObserver | undefined;
    let reveals: IntersectionObserver | undefined;
    let near: IntersectionObserver | undefined;
    let disposeRuntime = () => {};
    const controller = new AbortController();
    const animations = new Set<Animation>();
    const previousCurrent = chapterLinks.map(link => link.getAttribute('aria-current'));

    const update = () => {
      frame = 0;
      if (!alive || !started || !starts.length) return;
      const marker = window.scrollY + viewport * .3;
      let next = 0;
      starts.forEach((start, index) => { if (start <= marker) next = index; });
      if (next === active) return;
      active = next;
      const id = chapters[active]?.dataset.projectChapter;
      root.dataset.projectActiveChapter = id;
      chapterLinks.forEach(link => {
        if (link.dataset.projectChapterLink === id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const schedule = () => { if (alive && started && !frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      measureFrame = 0;
      if (!alive || !started) return;
      viewport = innerHeight;
      starts = chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY);
      schedule();
    };
    const scheduleMeasure = () => { if (alive && started && !measureFrame) measureFrame = requestAnimationFrame(measure); };
    const loadRuntime = () => {
      if (!alive || runtimeStarted) return;
      runtimeStarted = true;
      near?.disconnect();
      void import('./project-motion-timelines').then(async ({ mountProjectMotion }) => {
        if (!alive || controller.signal.aborted) return;
        const dispose = await mountProjectMotion(root, controller.signal);
        if (!alive || controller.signal.aborted) dispose(); else disposeRuntime = dispose;
      }).catch(() => { /* The complete server page remains available on runtime errors. */ });
    };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      window.removeEventListener('scroll', begin);
      resize = new ResizeObserver(scheduleMeasure);
      chapters.forEach(chapter => resize?.observe(chapter));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', scheduleMeasure, { passive: true });
      window.addEventListener('dos-orillas:refresh', scheduleMeasure);
      scheduleMeasure();
      document.fonts.ready.then(scheduleMeasure).catch(() => {});
      reveals = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          const image = target.hasAttribute('data-project-image-reveal') || target.hasAttribute('data-project-next-reveal');
          const animation = target.animate(image ? [
            { clipPath: 'inset(10% 0 10% 0)', opacity: .5 }, { clipPath: 'inset(0% 0 0% 0)', opacity: 1 },
          ] : [
            { transform: 'translateY(24px)', opacity: .4 }, { transform: 'translateY(0)', opacity: 1 },
          ], { duration: image ? 850 : 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none' });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          reveals?.unobserve(target);
        });
      }, { threshold: .1 });
      const nativeSelector = tier === 1
        ? '[data-project-text],[data-project-image-reveal],[data-project-next-reveal]'
        : '[data-project-text],[data-project-image-reveal]';
      root.querySelectorAll<HTMLElement>(nativeSelector).forEach(element => {
        if (element.getBoundingClientRect().top >= innerHeight) reveals?.observe(element);
      });
      if (tier >= 2) {
        near = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) loadRuntime();
        }, { rootMargin: '600px 0px' });
        root.querySelectorAll<HTMLElement>('[data-project-real-cover="true"] .case-cover,[data-project-gallery],[data-project-next-reveal]')
          .forEach(element => near?.observe(element));
      }
      root.dataset.projectMotionReady = 'true';
    };
    window.addEventListener('scroll', begin, { passive: true, once: true });
    if (scrollY > 0) begin();
    return () => {
      alive = false;
      controller.abort();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
      resize?.disconnect();
      reveals?.disconnect();
      near?.disconnect();
      animations.forEach(animation => animation.cancel());
      window.removeEventListener('scroll', begin);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('dos-orillas:refresh', scheduleMeasure);
      disposeRuntime();
      chapterLinks.forEach((link, index) => {
        const current = previousCurrent[index];
        if (current === null || current === undefined) link.removeAttribute('aria-current'); else link.setAttribute('aria-current', current);
      });
      delete root.dataset.projectActiveChapter;
      delete root.dataset.projectMotionReady;
    };
  }, [slug, tier, ready]);
  return null;
}
