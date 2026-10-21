import type { MotionTier } from '@/hooks/useMotionTier';
import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import { distance, dur, ease, motionCssEase, stagger } from '@/lib/motion-tokens';

type Cleanup = () => void;
const readableTargets = '.team-caption';

function nativeReveals(root: HTMLElement): Cleanup {
  const animations: Animation[] = [];
  const timers: number[] = [];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const pending = animations.filter(animation => animation.effect instanceof KeyframeEffect
        && animation.effect.target instanceof Element && entry.target.contains(animation.effect.target));
      pending.forEach(animation => animation.play());
      observer.unobserve(entry.target);
      timers.push(window.setTimeout(() => pending.forEach(animation => animation.cancel()), 3000));
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  const reveal = (trigger: HTMLElement, targets: HTMLElement[], keyframes: Keyframe[]) => {
    if (trigger.getBoundingClientRect().top < innerHeight * 0.85) return;
    targets.forEach((target, index) => {
      if (typeof target.animate !== 'function') return;
      const animation = target.animate(keyframes, { duration: dur.md * 1000, delay: index * stagger.lines * 1000,
        easing: motionCssEase.out, fill: 'both' });
      animation.pause();
      animation.currentTime = 0;
      animation.onfinish = () => animation.cancel();
      animations.push(animation);
    });
    observer.observe(trigger);
  };
  const cleanup = () => {
    observer.disconnect();
    timers.forEach(timer => clearTimeout(timer));
    animations.forEach(animation => { animation.onfinish = null; animation.cancel(); });
  };
  try {
    root.querySelectorAll<HTMLElement>('.team-headline').forEach(block => {
      reveal(block, Array.from(block.querySelectorAll<HTMLElement>('[data-editorial-line]')),
        [{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'none' }]);
    });
    root.querySelectorAll<HTMLElement>('[data-editorial-photo][data-photo-real="true"]').forEach(photo => {
      const mask = photo.querySelector<HTMLElement>('.editorial-photo-mask');
      const side = photo.dataset.revealSide;
      if (mask) reveal(photo, [mask], [{ clipPath: side === 'left' ? 'inset(0 100% 0 0)' : side === 'right' ? 'inset(0 0 0 100%)' : 'inset(100% 0 0 0)' }, { clipPath: 'inset(0)' }]);
    });
    root.querySelectorAll<HTMLElement>('[data-editorial-bridge]').forEach(bridge => reveal(bridge, [bridge],
      [{ transform: 'scaleY(0)' }, { transform: 'none' }]));
    return cleanup;
  } catch (error) { cleanup(); throw error; }
}

function fullTeam(root: HTMLElement, runtime: GSAPRuntime): Cleanup {
  const { gsap, syncTriggerCount } = runtime;
  const stage = root.querySelector<HTMLElement>('.team-stage');
  if (!stage) return () => {};
  const context = gsap.context(() => {}, root);
  let removeFocus = () => {};
  const cleanup = () => {
    removeFocus(); context.revert(); syncTriggerCount();
    delete root.dataset.editorialStart; delete root.dataset.editorialEnd;
  };
  try {
    context.add(() => {
      const photos = Array.from(root.querySelectorAll<HTMLElement>('.team-portrait'));
      const captions = Array.from(root.querySelectorAll<HTMLElement>('.team-caption'));
      const seam = root.querySelector<HTMLElement>('.team-seam');
      const timeline = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 80px', end: '+=150%', pin: stage,
        scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
        onRefresh: trigger => { root.dataset.editorialStart = String(trigger.start); root.dataset.editorialEnd = String(trigger.end); },
      } });
      photos.forEach((photo, index) => {
        timeline.fromTo(photo, { y: () => innerHeight * (index === 0 ? 0.12 : -0.08), x: () => innerWidth * (index === 0 ? -0.035 : 0.035) },
          { y: 0, x: 0, duration: 0.65, ease: ease.scrub }, 0);
        const mask = photo.querySelector<HTMLElement>('.editorial-photo-mask');
        if (mask && photo.dataset.photoReal === 'true') timeline.fromTo(mask,
          { clipPath: index === 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' }, { clipPath: 'inset(0)', duration: 0.35, ease: ease.inOut }, 0);
      });
      if (seam) timeline.fromTo(seam, { scaleY: 0 }, { scaleY: 1, duration: 0.25, ease: ease.scrub }, 0.5);
      timeline.fromTo(captions, { yPercent: distance.reveal, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.2, stagger: 0.04, ease: ease.scrub }, 0.7);
      const focus = () => {
        const trigger = timeline.scrollTrigger;
        if (!trigger || trigger.progress >= 0.95) return;
        // Native focus can only advance this scene; it never returns to its start.
        const destination = trigger.start + (trigger.end - trigger.start) * 0.95;
        if (destination <= window.scrollY) return;
        if (window.__lenis) window.__lenis.scrollTo(destination, { immediate: true, force: true });
        else window.scrollTo({ top: destination, behavior: 'instant' });
      };
      root.addEventListener('focusin', focus);
      removeFocus = () => root.removeEventListener('focusin', focus);
    });
  } catch (error) { cleanup(); throw error; }
  syncTriggerCount();
  return cleanup;
}

export function mountEditorial(root: HTMLElement, tier: MotionTier, signal: AbortSignal): Cleanup {
  let alive = true; let generation = 0; let frame = 0; let key = ''; let stop: Cleanup = () => {};
  const targets = Array.from(root.querySelectorAll<HTMLElement>(readableTargets));
  const footprint = () => `${innerWidth}:${innerHeight}:${targets.map(target => `${target.scrollWidth}:${target.scrollHeight}:${target.clientWidth}`).join('|')}`;
  const notify = () => window.dispatchEvent(new Event('dos-orillas:refresh'));
  const fallback = () => { stop(); stop = () => {}; root.dataset.editorialProfile = 'flow'; delete root.dataset.editorialReady; notify(); };
  const prepare = () => {
    frame = 0;
    if (!alive || signal.aborted || !root.isConnected) return;
    const nextKey = footprint(); if (key === nextKey) return; key = nextKey;
    const current = ++generation; stop(); stop = () => {}; delete root.dataset.editorialReady;
    root.dataset.editorialProfile = 'flow';
    const scene = root.dataset.editorial;
    if (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) > 24) { notify(); return; }
    // Without real portraits the team remains a complete typographic pair.
    // Its names and roles never wait behind a photo reveal or a pinned stage.
    if (scene === 'team' && !root.querySelector('[data-editorial-photo][data-photo-real="true"]')) { notify(); return; }
    // Sólo el equipo tiene escena propia; el resto de las secciones editoriales se lee en flujo.
    if (scene !== 'team') { root.dataset.editorialReady = 'true'; key = footprint(); notify(); return; }
    if (tier === 1 || innerWidth < 1024 || innerHeight <= 700) {
      root.dataset.editorialProfile = 'lite';
      try {
        const removeReveal = nativeReveals(root);
        stop = removeReveal; root.dataset.editorialReady = 'true'; key = footprint();
      } catch { fallback(); }
      return;
    }
    void loadGSAP().then(runtime => {
      if (!alive || signal.aborted || current !== generation) return;
      root.dataset.editorialProfile = 'full';
      const stage = root.querySelector<HTMLElement>('.team-stage');
      const pair = root.querySelector<HTMLElement>('.team-pair');
      const teamFits = !stage || !pair || pair.scrollHeight + innerHeight * 0.12 <= stage.clientHeight && pair.scrollWidth <= pair.clientWidth + 2;
      if (!teamFits || stage && stage.getBoundingClientRect().top < innerHeight * 0.85) {
        fallback(); key = footprint(); return;
      }
      stop = fullTeam(root, runtime);
      root.dataset.editorialReady = 'true'; key = footprint(); notify();
    }).catch(() => { if (alive && !signal.aborted && current === generation) fallback(); });
  };
  const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(prepare); };
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  targets.forEach(target => resize?.observe(target));
  window.addEventListener('resize', schedule, { passive: true });
  void document.fonts.ready.then(schedule);
  const cleanup = () => {
    if (!alive) return; alive = false; generation += 1;
    cancelAnimationFrame(frame); resize?.disconnect(); window.removeEventListener('resize', schedule);
    signal.removeEventListener('abort', cleanup); stop();
    delete root.dataset.editorialProfile; delete root.dataset.editorialReady;
    delete root.dataset.editorialStart; delete root.dataset.editorialEnd; notify();
  };
  signal.addEventListener('abort', cleanup, { once: true });
  prepare();
  return cleanup;
}
