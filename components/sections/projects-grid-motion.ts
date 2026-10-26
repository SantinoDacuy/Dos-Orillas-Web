import { loadGSAP } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

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
