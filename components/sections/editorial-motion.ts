import type { MotionTier } from '@/hooks/useMotionTier';
import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import { distance, dur, ease, motionCssEase, stagger } from '@/lib/motion-tokens';

type Cleanup = () => void;
const readableTargets = '.studio-headline,.team-caption,.final-cta-premise,.stack-header';

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
    root.querySelectorAll<HTMLElement>('.studio-headline,.team-headline,.stack-headline,.final-cta-premise').forEach(block => {
      reveal(block, Array.from(block.querySelectorAll<HTMLElement>('[data-editorial-line]')),
        [{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'none' }]);
    });
    root.querySelectorAll<HTMLElement>('.studio-lead-quote, .studio-paragraph, .studio-bridge-wrapper').forEach(block => {
      reveal(block, [block], [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }]);
    });
    root.querySelectorAll<HTMLElement>('[data-editorial-photo][data-photo-real="true"]').forEach(photo => {
      const mask = photo.querySelector<HTMLElement>('.editorial-photo-mask');
      const side = photo.dataset.revealSide;
      if (mask) reveal(photo, [mask], [{ clipPath: side === 'left' ? 'inset(0 100% 0 0)' : side === 'right' ? 'inset(0 0 0 100%)' : 'inset(100% 0 0 0)' }, { clipPath: 'inset(0)' }]);
    });
    root.querySelectorAll<HTMLElement>('[data-editorial-bridge]').forEach(bridge => reveal(bridge, [bridge],
      [{ transform: bridge.classList.contains('final-cta-bridge') ? 'scaleX(0)' : 'scaleY(0)' }, { transform: 'none' }]));
    return cleanup;
  } catch (error) { cleanup(); throw error; }
}

function fullStudio(root: HTMLElement, runtime: GSAPRuntime): Cleanup {
  const { gsap, syncTriggerCount } = runtime;
  const context = gsap.context(() => {}, root);
  try {
    context.add(() => {
      const heading = root.querySelector<HTMLElement>('.studio-headline');
      const badge = root.querySelector<HTMLElement>('.radiant-badge');
      const line1 = root.querySelector<HTMLElement>('[data-studio-line="1"] .studio-headline-inner');
      const line2 = root.querySelector<HTMLElement>('[data-studio-line="2"] .studio-headline-inner');
      const line3 = root.querySelector<HTMLElement>('[data-studio-line="3"] .studio-headline-inner');
      const lead = root.querySelector<HTMLElement>('.studio-lead-quote');
      const paragraph = root.querySelector<HTMLElement>('.studio-paragraph');
      const bridgePath = root.querySelector<SVGLineElement>('.studio-bridge-path');
      const bridgePin = root.querySelector<HTMLElement>('.studio-bridge-pin');
      const terracotta = root.querySelector<HTMLElement>('.studio-terracotta-transition');

      if (!heading) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.6,
        },
      });

      // 1. Entra el eyebrow y la línea 1 del titular
      if (badge) {
        timeline.fromTo(badge, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0);
      }
      if (line1) {
        timeline.fromTo(line1, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.05);
      }

      // 2. Al avanzar el scroll, aparece la línea 2 y entra la frase principal
      if (line2) {
        timeline.fromTo(line2, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.25);
      }
      if (lead) {
        timeline.fromTo(lead, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.3);
      }

      // 3. Aparece la línea 3 en cian y el párrafo, y el puente se dibuja con las coordenadas
      if (line3) {
        timeline.fromTo(line3, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.5);
      }
      if (paragraph) {
        timeline.fromTo(paragraph, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.55);
      }
      if (bridgePath) {
        timeline.fromTo(bridgePath, { strokeDashoffset: 968 }, { strokeDashoffset: 0, duration: 0.35, ease: 'none' }, 0.55);
      }
      if (bridgePin) {
        timeline.fromTo(bridgePin, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' }, 0.65);
      }

      // 4. Transición suave de fondo hacia naranja terracota (#B85838) del carrusel de equipo
      if (terracotta) {
        timeline.fromTo(terracotta, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.in' }, 0.7);
      }
    });
  } catch (error) { context.revert(); syncTriggerCount(); throw error; }
  syncTriggerCount();
  return () => { context.revert(); syncTriggerCount(); };
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

function finalCtaInteractions(root: HTMLElement, runtime?: GSAPRuntime): Cleanup {
  const link = root.querySelector<HTMLAnchorElement>('[data-final-cta]');
  if (!link) return () => {};
  const context = runtime?.gsap.context(() => {}, root);
  const listeners: Cleanup[] = [];
  const listen = <K extends keyof HTMLElementEventMap>(event: K, callback: (event: HTMLElementEventMap[K]) => void) => {
    link.addEventListener(event, callback); listeners.push(() => link.removeEventListener(event, callback));
  };
  listen('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
    if (!target || !window.__lenis) return;
    event.preventDefault();
    window.__lenis.scrollTo(target, { duration: dur.lg });
    // Keep the native destination discoverable after smooth anchor navigation.
    if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
  });
  if (runtime && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    context?.add(() => {
      const xTo = runtime.gsap.quickTo(link, 'x', { duration: dur.sm, ease: ease.soft });
      const yTo = runtime.gsap.quickTo(link, 'y', { duration: dur.sm, ease: ease.soft });
      let centerX = 0; let centerY = 0;
      listen('pointerenter', () => { const rect = link.getBoundingClientRect(); centerX = rect.left + rect.width / 2; centerY = rect.top + rect.height / 2; });
      listen('pointermove', event => { xTo((event.clientX - centerX) * distance.magnet); yTo((event.clientY - centerY) * distance.magnet); });
      listen('pointerleave', () => { xTo(0); yTo(0); });
      listen('focus', () => { xTo(0); yTo(0); });
    });
  }
  return () => { listeners.forEach(remove => remove()); context?.revert(); };
}

function fullCTA(root: HTMLElement, runtime: GSAPRuntime): Cleanup {
  const { gsap, syncTriggerCount } = runtime;
  const context = gsap.context(() => {}, root);
  let removeInteractions = () => {};
  try {
    context.add(() => {
      const premise = root.querySelector<HTMLElement>('.final-cta-premise');
      if (premise && premise.getBoundingClientRect().top >= innerHeight * 0.85) {
        gsap.fromTo(premise.querySelectorAll('[data-editorial-line]'), { yPercent: distance.reveal, opacity: 0 },
          { yPercent: 0, opacity: 1, stagger: stagger.lines, ease: ease.scrub,
            scrollTrigger: { trigger: premise, start: 'top 80%', end: 'bottom 45%', scrub: true } });
      }
      const heading = root.querySelector<HTMLElement>('.final-cta-title');
      const bridge = root.querySelector<HTMLElement>('.final-cta-bridge');
      if (heading && bridge) gsap.fromTo(bridge, { scaleX: 0 }, { scaleX: 1, ease: ease.scrub,
        scrollTrigger: { trigger: heading, start: 'top 85%', end: 'bottom 55%', scrub: true } });
    });
    removeInteractions = finalCtaInteractions(root, runtime);
  } catch (error) { context.revert(); removeInteractions(); syncTriggerCount(); throw error; }
  syncTriggerCount();
  return () => { removeInteractions(); context.revert(); syncTriggerCount(); };
}

/** Native loop engine; rates use cached geometry and scroll velocity, never layout per frame. */
function kineticStack(root: HTMLElement, tier: MotionTier): Cleanup {
  const animations: Animation[] = [];
  const tracks = Array.from(root.querySelectorAll<HTMLElement>('.stack-marquee-track'));
  root.dataset.editorialProfile = 'marquee';
  let visible = false; let hovered = false; let frame = 0; let rate = 1; let targetRate = 1;
  let appliedRate = 1;
  let lastScroll = window.scrollY; let lastTime = performance.now();
  const tick = () => {
    frame = 0;
    if (!visible || hovered || document.hidden) return;
    rate += (targetRate - rate) * 0.08;
    targetRate += ((targetRate < 0 ? -1 : 1) - targetRate) * 0.025;
    if (Math.abs(rate - appliedRate) > 0.002) {
      animations.forEach(animation => {
        if (typeof animation.updatePlaybackRate === 'function') animation.updatePlaybackRate(rate);
        else animation.playbackRate = rate;
      });
      appliedRate = rate;
    }
    const baseline = targetRate < 0 ? -1 : 1;
    if (Math.abs(rate - baseline) > 0.01 || Math.abs(targetRate - baseline) > 0.01) frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0;
    const playing = visible && !hovered && !document.hidden;
    animations.forEach(animation => { if (playing) animation.play(); else animation.pause(); });
    if (playing) frame = requestAnimationFrame(tick);
  };
  const scroll = () => {
    const now = performance.now(); const position = window.scrollY;
    const velocity = (position - lastScroll) / Math.max(16, now - lastTime);
    lastScroll = position; lastTime = now;
    if (Math.abs(velocity) > 0.01) targetRate = Math.sign(velocity) * (1 + Math.min(Math.abs(velocity) * 0.8, 3));
    if (visible && !hovered && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  };
  const enter = () => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) { hovered = true; sync(); } };
  const leave = () => { hovered = false; sync(); };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); });
  const hoverTarget = root.querySelector<HTMLElement>('.stack-marquees');
  const cleanup = () => {
    observer.disconnect(); cancelAnimationFrame(frame);
    animations.forEach(animation => animation.cancel());
    window.removeEventListener('scroll', scroll);
    document.removeEventListener('visibilitychange', sync);
    hoverTarget?.removeEventListener('pointerenter', enter); hoverTarget?.removeEventListener('pointerleave', leave);
    delete root.dataset.editorialProfile;
  };
  try {
    for (const track of tracks) {
      const width = track.scrollWidth / 2;
      const reverse = track.dataset.marqueeDirection === 'reverse';
      const duration = Math.max(40000, width / (tier === 1 ? 0.016 : 0.033));
      const animation = track.animate([
        { transform: `translateX(${reverse ? -width : 0}px)` },
        { transform: `translateX(${reverse ? 0 : -width}px)` },
      ], { duration, iterations: Infinity, easing: 'linear', fill: 'both' });
      // Start well inside the infinite loop so reverse playback stays continuous.
      animation.currentTime = duration * 500; animation.pause(); animations.push(animation);
    }
    observer.observe(root);
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('visibilitychange', sync);
    hoverTarget?.addEventListener('pointerenter', enter); hoverTarget?.addEventListener('pointerleave', leave);
    return cleanup;
  } catch (error) { cleanup(); throw error; }
}

/** Resize/font changes rebuild only this scene; every profile has a complete static base. */
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
    if (scene === 'stack') {
      // Enhanced rows are still typography, so oversized text naturally remains in the real list.
      const rootFont = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const listItem = root.querySelector<HTMLElement>('.stack-list li');
      const listFont = listItem ? Number.parseFloat(getComputedStyle(listItem).fontSize) : rootFont;
      if (rootFont > 24 || listFont > 24 || typeof root.animate !== 'function') return;
      try { stop = kineticStack(root, tier); root.dataset.editorialReady = 'true'; key = footprint(); notify(); } catch { fallback(); }
      return;
    }
    if (tier === 1 || innerWidth < 1024 || innerHeight <= 700) {
      root.dataset.editorialProfile = 'lite';
      try {
        const removeReveal = nativeReveals(root); const removeLinks = scene === 'cta' ? finalCtaInteractions(root) : () => {};
        stop = () => { removeReveal(); removeLinks(); }; root.dataset.editorialReady = 'true'; key = footprint();
      } catch { fallback(); }
      return;
    }
    void loadGSAP().then(runtime => {
      if (!alive || signal.aborted || current !== generation) return;
      root.dataset.editorialProfile = 'full';
      const heading = root.querySelector<HTMLElement>('.studio-headline');
      const stage = root.querySelector<HTMLElement>('.team-stage');
      const pair = root.querySelector<HTMLElement>('.team-pair');
      const studioFits = !heading || heading.scrollHeight + 144 <= innerHeight && heading.scrollWidth <= heading.clientWidth + 2;
      const teamFits = !stage || !pair || pair.scrollHeight + innerHeight * 0.12 <= stage.clientHeight && pair.scrollWidth <= pair.clientWidth + 2;
      if (!studioFits || !teamFits || scene === 'team' && stage && stage.getBoundingClientRect().top < innerHeight * 0.85) {
        fallback(); key = footprint(); return;
      }
      stop = scene === 'studio' ? fullStudio(root, runtime) : scene === 'team' ? fullTeam(root, runtime) : fullCTA(root, runtime);
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
