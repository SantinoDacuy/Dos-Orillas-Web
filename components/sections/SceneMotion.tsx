'use client';
import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

declare global {
  interface Window { __sceneRanges?: Record<string, { start: number; end: number }>; }
}
function useScene(name: 'hero' | 'distance') {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready) return;
    const root = getMountedSceneRoot(`[data-scene="${name}"]`);
    if (!root) return;
    let disposed = false;
    let stopEnhancement = () => {};
    let frame = 0;
    let crowded = false;
    let profile = '';
    let viewport = '';
    const narrow = matchMedia('(max-width: 767px)');
    const short = matchMedia('(max-width: 767px) and (max-height: 620px), (min-width: 768px) and (max-height: 680px)');

    const enhance = () => {
      const controller = new AbortController();
      let mountedCleanup: (() => void) | undefined;
      let triggerCleanup = () => {};
      let requested = false;
      const load = () => {
        if (disposed || controller.signal.aborted || requested) return;
        requested = true;
        triggerCleanup();
        void import('./scene-timelines').then(async ({ mountScene }) => {
          if (disposed || controller.signal.aborted) return;
          const dispose = await mountScene(root, name, tier, controller.signal);
          if (disposed || controller.signal.aborted) dispose();
          else mountedCleanup = dispose;
        }).catch(() => {
          if (!disposed && !controller.signal.aborted) {
            crowded = true;
            root.dataset.sceneFlow = 'true';
            schedule();
          }
        });
      };
      stopEnhancement = () => { controller.abort(); triggerCleanup(); mountedCleanup?.(); };
      const begin = () => {
        triggerCleanup();
        if (disposed || controller.signal.aborted) return;
        if (name === 'hero') load();
        else {
          const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) load();
          }, { rootMargin: '1400px 0px' });
          triggerCleanup = () => observer.disconnect();
          observer.observe(root);
        }
      };
      triggerCleanup = () => window.removeEventListener('scroll', begin);
      window.addEventListener('scroll', begin, { passive: true, once: true });
      // Distance reaches this point only after native travel or a restored
      // sentinel. Preserve that signal rather than forcing layout with scrollY.
      // The unused legacy Hero branch keeps its original restoration behavior.
      if (name === 'distance' || window.scrollY > 0) begin();
    };

    const fits = () => {
      if (name === 'hero') {
        const stage = root.querySelector<HTMLElement>('.hero-stage');
        const title = root.querySelector<HTMLElement>('.hero-title');
        const bottom = root.querySelector<HTMLElement>('.hero-bottom');
        const photo = root.querySelector<HTMLElement>('.hero-photo-right');
        const studio = root.querySelector<HTMLElement>('.hero-studio');
        if (!stage || !title || !bottom || !photo || getComputedStyle(title).position === 'static') return true;
        const second = root.querySelector<HTMLElement>('.hero-second');
        let phraseFits = true;
        if (second) {
          const text = document.createRange();
          text.selectNodeContents(second);
          const bounds = text.getBoundingClientRect();
          const stageBounds = stage.getBoundingClientRect();
          phraseFits = bounds.left >= stageBounds.left - 2 && bounds.right <= stageBounds.right + 2;
        }
        const titleEnd = title.offsetTop + title.offsetHeight + (narrow.matches ? (studio?.offsetHeight ?? 0) + 8 : 0);
        return phraseFits && title.scrollWidth <= title.clientWidth + 2 &&
          titleEnd + 8 <= bottom.offsetTop && photo.offsetTop + photo.offsetHeight <= stage.clientHeight;
      }
      const connection = root.querySelector<HTMLElement>('.distance-connection');
      const statements = root.querySelector<HTMLElement>('.distance-statements');
      const description = root.querySelector<HTMLElement>('.distance-description');
      if (!connection || !statements || getComputedStyle(connection).position === 'static') return true;
      const lateContentFits = connection.offsetTop + connection.offsetHeight + 8 <= statements.offsetTop;
      const staticCopyFits = tier !== 0 || !description || description.offsetTop + description.offsetHeight + 12 <= connection.offsetTop;
      return lateContentFits && staticCopyFits;
    };

    const updateLayout = () => {
      frame = 0;
      if (disposed) return;
      const nextViewport = `${innerWidth}:${innerHeight}`;
      if (viewport !== nextViewport) {
        viewport = nextViewport;
        crowded = false;
        delete root.dataset.sceneFlow;
      }
      // Once a text-size collision selects flow, retain it until the viewport or
      // tier changes. Flow itself resizes these boxes, so re-testing it would loop.
      if (!short.matches && !crowded) crowded = !fits();
      const flow = short.matches || crowded;
      const nextProfile = `${narrow.matches}:${flow}:${tier}`;
      if (nextProfile === profile) {
        if (flow) root.dataset.sceneFlow = 'true';
        return;
      }
      profile = nextProfile;
      stopEnhancement();
      stopEnhancement = () => {};
      if (flow) root.dataset.sceneFlow = 'true';
      else delete root.dataset.sceneFlow;
      if (!flow && tier > 0) enhance();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(updateLayout); };
    const watched = name === 'hero' ? '.hero-stage,.hero-title,.hero-title-dos,.hero-title-orillas,.hero-second,.hero-bottom,.hero-studio' : '.distance-stage,.distance-description,.distance-connection,.distance-statements';
    let resize: ResizeObserver | undefined;
    let restoredPosition: IntersectionObserver | undefined;
    let watching = false;
    const startLayout = () => {
      if (disposed || watching) return;
      watching = true;
      window.removeEventListener('scroll', startLayout);
      restoredPosition?.disconnect();
      resize = new ResizeObserver(schedule);
      root.querySelectorAll<HTMLElement>(watched).forEach(node => resize?.observe(node));
      narrow.addEventListener('change', schedule);
      short.addEventListener('change', schedule);
      window.addEventListener('resize', schedule, { passive: true });
      schedule();
    };
    // The second scene is below the fold. CSS supplies its initial/short-height
    // layout; collision measurements begin with actual travel, including restores.
    if (name === 'hero') startLayout();
    else {
      window.addEventListener('scroll', startLayout, { passive: true, once: true });
      // IO supplies already-computed geometry for restored/hash positions. The
      // scene itself covers a visible restore if Nav is still streaming.
      // Keep this activation deferred when integrating the shared shell in F6.
      const sentinel = document.querySelector('.nav-sentinel');
      restoredPosition = new IntersectionObserver(([entry]) => {
        if (entry && (entry.boundingClientRect.top < 0 ||
          (!sentinel && entry.isIntersecting && entry.intersectionRect.height > 0))) startLayout();
      }, { threshold: 1 });
      restoredPosition.observe(sentinel ?? root);
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', startLayout);
      restoredPosition?.disconnect();
      resize?.disconnect();
      narrow.removeEventListener('change', schedule);
      short.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
      stopEnhancement();
      delete root.dataset.sceneFlow;
    };
  }, [name, tier, ready]);
}
export function HeroMotion() { useScene('hero'); return null; }
export function DistanceMotion() { useScene('distance'); return null; }
