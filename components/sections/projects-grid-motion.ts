import { loadGSAP } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';
import { projectGridCopy } from '@/content/project-grid';

export interface ProjectGridAnimator { dispose: () => void; }
const idle: ProjectGridAnimator = { dispose: () => {} };

export async function mountProjectGrid(root: HTMLElement, tier: MotionTier, signal: AbortSignal): Promise<ProjectGridAnimator> {
  const { gsap, ScrollTrigger, syncTriggerCount } = await loadGSAP();
  if (signal.aborted || !root.isConnected || tier === 0) return idle;
  let alive = true;
  let refreshFrame = 0;
  let mediaContext: ReturnType<typeof gsap.matchMedia> | undefined;
  const context = gsap.context(() => {}, root);
  const reveals = new Map<HTMLElement, ReturnType<typeof gsap.timeline>>();
  const focus = (event: FocusEvent) => {
    const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.project-card') : null;
    if (!card) return;
    const reveal = reveals.get(card);
    if (reveal) {
      reveal.progress(1);
      reveal.scrollTrigger?.kill();
      reveal.kill();
      reveals.delete(card);
    }
  };
  const refresh = () => {
    if (!alive || signal.aborted || refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (alive && !signal.aborted) ScrollTrigger.refresh();
    });
  };
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(refreshFrame);
    root.removeEventListener('focusin', focus);
    mediaContext?.revert();
    context.revert();
    reveals.clear();
    delete root.dataset.projectsEnhanced;
    root.querySelectorAll<HTMLElement>('[data-project-parallax]').forEach(layer => { delete layer.dataset.projectParallaxActive; });
    syncTriggerCount();
  };

  try {
    context.add(() => {
      const title = root.querySelector<HTMLElement>('.project-grid-title-inner');
      if (title && title.getBoundingClientRect().top > innerHeight * .85) {
        gsap.fromTo(title, { y: 24, opacity: .68 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: title.parentElement, start: 'top 85%', once: true } });
      }
      const cards = Array.from(root.querySelectorAll<HTMLElement>('.project-card'));
      cards.forEach((card, index) => {
        const frame = card.querySelector<HTMLElement>('[data-project-reveal]');
        const inner = card.querySelector<HTMLElement>('.project-card-reveal-inner');
        // A late import must not hide an image someone is already reading.
        if (!frame || !inner || frame.getBoundingClientRect().top <= innerHeight * .85 || card.matches(':focus-within')) return;
        const reveal = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 85%', once: true } });
        reveal.fromTo(frame, { clipPath: index % 2 ? 'inset(0 0 0 100%)' : 'inset(100% 0 0 0)' }, { clipPath: 'inset(0)', duration: 1.2, ease: 'power3.inOut' }, 0)
          .fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
        reveals.set(card, reveal);
      });
      if (tier >= 2) {
        mediaContext = gsap.matchMedia();
        mediaContext.add('(min-width: 1024px) and (min-height: 640px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
          const candidates = cards.flatMap(card => {
            const speed = Number(card.dataset.speed);
            const layer = card.querySelector<HTMLElement>('[data-project-parallax]');
            return layer && Number.isFinite(speed) && speed >= .94 && speed <= 1.06 ? [{ layer, card, speed, delta: 0, fit: false }] : [];
          });
          const measure = () => {
            candidates.forEach(item => {
              const height = item.layer.offsetHeight;
              item.fit = height > 0 && height <= innerHeight * .92;
              const distance = (1 - item.speed) * (innerHeight + height);
              // The largest excursion is ±24px; the grid reserves ≥88px
              // between rows so two adjacent layers still have clear air.
              item.delta = item.fit ? Math.sign(distance) * Math.min(Math.abs(distance), 48) : 0;
              if (!item.fit) delete item.layer.dataset.projectParallaxActive;
            });
          };
          measure();
          ScrollTrigger.addEventListener('refreshInit', measure);
          candidates.forEach(item => {
            gsap.fromTo(item.layer, { y: () => -item.delta / 2 }, {
              y: () => item.delta / 2, ease: 'none',
              scrollTrigger: {
                trigger: item.card, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true,
                onToggle: self => { item.layer.dataset.projectParallaxActive = String(item.fit && self.isActive); },
                onRefresh: self => { item.layer.dataset.projectParallaxActive = String(item.fit && self.isActive); },
              },
            });
          });
          return () => {
            ScrollTrigger.removeEventListener('refreshInit', measure);
            candidates.forEach(item => { delete item.layer.dataset.projectParallaxActive; });
          };
        });
      }
      root.dataset.projectsEnhanced = 'true';
    });
    root.addEventListener('focusin', focus);
    syncTriggerCount();
    refresh();
    void document.fonts.ready.then(refresh).catch(() => {});
  } catch (error) {
    dispose();
    throw error;
  }
  return { dispose };
}

export async function mountBrandSeparator(root: HTMLElement, tier: MotionTier, signal: AbortSignal, getScrollVelocity: () => number | null): Promise<ProjectGridAnimator> {
  const { gsap, ScrollTrigger, syncTriggerCount } = await loadGSAP();
  if (signal.aborted || !root.isConnected || tier === 0) return idle;
  const track = root.querySelector<HTMLElement>('.brand-separator-track');
  const group = root.querySelector<HTMLElement>('.brand-separator-group');
  const windowNode = root.querySelector<HTMLElement>('.brand-separator-window');
  const button = root.querySelector<HTMLButtonElement>('.brand-separator-pause');
  if (!track || !group || !windowNode || !button) return idle;
  const context = gsap.context(() => {}, root);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let alive = true;
  let visible = false;
  let manuallyPaused = false;
  let hovered = false;
  let ticking = false;
  let measureFrame = 0;
  let period = 0;
  let x = 0;
  let direction = 1;
  let speed = 1;
  let scrollVelocity = 0;
  let lastVelocityTime = 0;
  let setter: (value: number) => void = () => {};
  const previousHidden = button.hidden;
  const previousText = button.textContent;
  const baseSpeed = tier === 1 ? 20 : 32;
  const tick = () => {
    if (!period) return;
    const velocity = getScrollVelocity() ?? (performance.now() - lastVelocityTime < 120 ? scrollVelocity : 0);
    if (Math.abs(velocity) > .1) direction = Math.sign(velocity);
    speed += (1 + Math.min(Math.abs(velocity) * .08, 3) - speed) * .08;
    // Keep the duplicated group seam exact in either scroll direction.
    x -= direction * baseSpeed * speed * Math.min(gsap.ticker.deltaRatio(60), 3) / 60;
    x = ((x % period) + period) % period - period;
    setter(x);
  };
  const setRunning = () => {
    const run = alive && visible && !document.hidden && !manuallyPaused && !hovered && period > 0;
    if (run === ticking) return;
    ticking = run;
    if (run) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
    root.dataset.separatorRunning = String(run);
  };
  const measure = () => {
    measureFrame = 0;
    if (!alive || signal.aborted) return;
    const next = group.offsetWidth;
    if (next > 0) {
      x = period ? x / period * next : 0;
      period = next;
      setter(x);
    }
    setRunning();
  };
  const requestMeasure = () => {
    if (alive && !signal.aborted && !measureFrame) measureFrame = requestAnimationFrame(measure);
  };
  const pause = () => {
    manuallyPaused = !manuallyPaused;
    button.textContent = manuallyPaused ? projectGridCopy.separatorResume : projectGridCopy.separatorPause;
    root.dataset.separatorPaused = String(manuallyPaused);
    setRunning();
  };
  const enter = (event: PointerEvent) => { if (fine.matches && event.pointerType !== 'touch') { hovered = true; setRunning(); } };
  const leave = () => { hovered = false; setRunning(); };
  const visibility = () => { scrollVelocity = 0; setRunning(); };
  const mode = () => { if (!fine.matches) leave(); };
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (!visible) scrollVelocity = 0;
    setRunning();
  });
  const resizeObserver = new ResizeObserver(requestMeasure);
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(measureFrame);
    gsap.ticker.remove(tick);
    ticking = false;
    observer.disconnect();
    resizeObserver.disconnect();
    button.removeEventListener('click', pause);
    windowNode.removeEventListener('pointerenter', enter);
    windowNode.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', visibility);
    fine.removeEventListener('change', mode);
    context.revert();
    button.hidden = previousHidden;
    button.textContent = previousText;
    delete root.dataset.separatorEnhanced;
    delete root.dataset.separatorRunning;
    delete root.dataset.separatorPaused;
    syncTriggerCount();
  };

  try {
    context.add(() => {
      gsap.set(track, { x: 0 });
      setter = gsap.quickSetter(track, 'x', 'px') as (value: number) => void;
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onUpdate: self => { scrollVelocity = self.getVelocity() / 60; lastVelocityTime = performance.now(); },
        onToggle: self => { if (!self.isActive) scrollVelocity = 0; },
      });
      root.dataset.separatorEnhanced = 'true';
    });
    button.addEventListener('click', pause);
    windowNode.addEventListener('pointerenter', enter);
    windowNode.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    fine.addEventListener('change', mode);
    button.hidden = false;
    observer.observe(root);
    resizeObserver.observe(group);
    requestMeasure();
    void document.fonts.ready.then(requestMeasure).catch(() => {});
    syncTriggerCount();
  } catch (error) {
    dispose();
    throw error;
  }
  return { dispose };
}
