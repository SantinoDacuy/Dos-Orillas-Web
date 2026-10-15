import type { MotionTier } from '@/hooks/useMotionTier';
import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import { distance, dur, ease, motionCssEase, stagger } from '@/lib/motion-tokens';

function fitsSticky(root: HTMLElement): boolean {
  const stage = root.querySelector<HTMLElement>('.manifesto-first-stage');
  return !!stage && innerHeight > 620 && stage.offsetHeight + Math.max(80, innerHeight * .1) + 20 <= innerHeight;
}

function mountFull(root: HTMLElement, runtime: GSAPRuntime): () => void {
  const { gsap, syncTriggerCount, motionDebugEnabled } = runtime;
  const markers = motionDebugEnabled();
  const context = gsap.context(() => {}, root);
  try {
    context.add(() => {
      // 1. Text reveals for first and second manifesto statements
      root.querySelectorAll<HTMLElement>('[data-manifesto-lines]').forEach(block => {
        const masks = block.querySelectorAll<HTMLElement>('.manifesto-line-mask');
        const lines = block.querySelectorAll<HTMLElement>('.manifesto-line-inner');
        gsap.set(masks, { overflow: 'clip' });
        gsap.fromTo(
          lines, 
          { yPercent: distance.reveal, opacity: 0 }, 
          {
            yPercent: 0,
            opacity: 1,
            duration: dur.lg,
            stagger: stagger.lines,
            ease: ease.out,
            scrollTrigger: {
              trigger: block,
              start: block.classList.contains('manifesto-second') ? 'top 75%' : 'top 85%',
              toggleActions: 'play none none reverse',
              markers,
            },
          }
        );
      });

      // 2. The strike-through line crossing out "PORQUE SÍ." on scroll
      const bridge = root.querySelector<HTMLElement>('[data-manifesto-bridge]');
      if (bridge) {
        gsap.fromTo(
          bridge,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: bridge,
              start: 'top 85%',
              end: 'top 48%',
              scrub: 0.5,
              markers,
            },
          }
        );
      }

      // 3. Aerial River Delta background subtle parallax
      const bgImg = root.querySelector<HTMLElement>('.manifesto-bg-img');
      if (bgImg) {
        gsap.fromTo(
          bgImg,
          { yPercent: -5, scale: 1.04 },
          {
            yPercent: 5,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }

      // 4. Description words lighting up progressively on scroll
      const description = root.querySelector<HTMLElement>('.manifesto-description');
      if (description) {
        const words = description.querySelectorAll<HTMLElement>('[data-manifesto-word]');
        gsap.fromTo(
          words,
          { opacity: 0.28, color: '#94a3b8', y: 3 },
          {
            opacity: 1,
            color: '#F2EEE6',
            y: 0,
            stagger: 0.08,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: description,
              start: 'top 85%',
              end: 'bottom 52%',
              scrub: 0.6,
              markers,
            },
          }
        );
      }
    });
  } catch (error) {
    context.revert();
    syncTriggerCount();
    throw error;
  }
  syncTriggerCount();
  window.dispatchEvent(new Event('dos-orillas:refresh'));
  return () => {
    context.revert();
    syncTriggerCount();
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
}

/** Lite uses native reveals and IntersectionObserver without GSAP */
function mountLite(root: HTMLElement): () => void {
  const animations: Animation[] = [];
  const timers: number[] = [];
  const originalStyles = new Map<HTMLElement, string | null>();
  let frame = 0;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const pending = animations.filter(
        animation =>
          animation.effect instanceof KeyframeEffect &&
          animation.effect.target instanceof Element &&
          entry.target.contains(animation.effect.target)
      );
      pending.forEach(animation => animation.play());
      observer.unobserve(entry.target);
      timers.push(window.setTimeout(() => pending.forEach(animation => animation.cancel()), 3000));
    }
  }, { rootMargin: '0px 0px -15% 0px' });

  const remember = (target: HTMLElement) => {
    if (!originalStyles.has(target)) originalStyles.set(target, target.getAttribute('style'));
  };

  const cleanup = () => {
    observer.disconnect();
    timers.forEach(timer => clearTimeout(timer));
    animations.forEach(animation => {
      animation.onfinish = null;
      animation.cancel();
    });
    cancelAnimationFrame(frame);
    originalStyles.forEach((style, target) => {
      if (style === null) target.removeAttribute('style');
      else target.setAttribute('style', style);
    });
  };

  const reveal = (trigger: HTMLElement, targets: HTMLElement[], keyframes: Keyframe[], delay = 0) => {
    if (typeof trigger.animate !== 'function') return;
    targets.forEach((target, index) => {
      const animation = target.animate(keyframes, {
        duration: dur.md * 1000,
        delay: index * delay,
        easing: motionCssEase.out,
        fill: 'both',
      });
      animation.pause();
      animation.currentTime = 0;
      animation.onfinish = () => animation.cancel();
      animations.push(animation);
    });
    observer.observe(trigger);
  };

  try {
    root.querySelectorAll<HTMLElement>('[data-manifesto-lines]').forEach(block => {
      block.querySelectorAll<HTMLElement>('.manifesto-line-mask').forEach(mask => {
        remember(mask);
        mask.style.overflow = 'clip';
      });
      reveal(
        block,
        Array.from(block.querySelectorAll<HTMLElement>('.manifesto-line-inner')),
        [{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        stagger.lines * 1000
      );
    });

    const bridge = root.querySelector<HTMLElement>('[data-manifesto-bridge]');
    if (bridge) {
      reveal(bridge, [bridge], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 200);
    }

    const description = root.querySelector<HTMLElement>('.manifesto-description');
    if (description) {
      reveal(
        description,
        Array.from(description.querySelectorAll<HTMLElement>('[data-manifesto-word]')),
        [{ opacity: 0.28 }, { opacity: 1 }],
        stagger.words * 1000
      );
    }

    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function mountManifesto(root: HTMLElement, tier: MotionTier, signal: AbortSignal): () => void {
  let disposed = false;
  let frame = 0;
  let generation = 0;
  let profile = '';
  let stop = () => {};
  let runtime: GSAPRuntime | undefined;

  const prepare = () => {
    frame = 0;
    if (disposed || signal.aborted) return;
    const sticky = fitsSticky(root);
    const flow = tier > 1 && !sticky;
    const nextProfile = `${tier}:${flow}:${innerWidth}:${innerHeight}`;
    if (profile === nextProfile) {
      runtime?.ScrollTrigger.refresh();
      return;
    }
    profile = nextProfile;
    const current = ++generation;
    stop();
    stop = () => {};
    delete root.dataset.manifestoReady;

    if (flow) {
      root.dataset.manifestoFlow = 'true';
      root.dataset.manifestoMode = 'flow';
    } else {
      delete root.dataset.manifestoFlow;
      root.dataset.manifestoMode = 'full';
    }

    if (tier === 1) {
      root.dataset.manifestoMode = 'lite';
      try {
        stop = mountLite(root);
        root.dataset.manifestoReady = 'true';
      } catch {
        root.dataset.manifestoFlow = 'true';
        root.dataset.manifestoMode = 'flow';
      }
      return;
    }

    // Full GSAP scroll interactions (always mounted for tier >= 2, whether sticky or flow)
    void loadGSAP()
      .then(loaded => {
        if (disposed || signal.aborted || current !== generation) return;
        runtime = loaded;
        stop = mountFull(root, loaded);
        root.dataset.manifestoReady = 'true';
      })
      .catch(() => {
        if (!disposed && !signal.aborted && current === generation) {
          stop();
          root.dataset.manifestoFlow = 'true';
          root.dataset.manifestoMode = 'flow';
        }
      });
  };

  const schedule = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(prepare);
  };

  const resize = new ResizeObserver(schedule);
  root.querySelectorAll<HTMLElement>('.manifesto-first-stage,.manifesto-statement').forEach(target =>
    resize.observe(target)
  );
  window.addEventListener('resize', schedule, { passive: true });
  void document.fonts.ready.then(schedule);
  prepare();

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    generation += 1;
    cancelAnimationFrame(frame);
    resize.disconnect();
    window.removeEventListener('resize', schedule);
    signal.removeEventListener('abort', cleanup);
    stop();
    delete root.dataset.manifestoFlow;
    delete root.dataset.manifestoMode;
    delete root.dataset.manifestoReady;
  };

  signal.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
