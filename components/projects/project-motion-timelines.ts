import { loadGSAP } from '@/lib/gsap';

export async function mountProjectMotion(root: HTMLElement, signal: AbortSignal): Promise<() => void> {
  const { gsap, ScrollTrigger, syncTriggerCount } = await loadGSAP();
  if (signal.aborted || !root.isConnected) return () => {};
  const context = gsap.context(() => {}, root);
  let alive = true;
  let frame = 0;
  const dispose = () => {
    if (!alive) return;
    alive = false;
    signal.removeEventListener('abort', dispose);
    cancelAnimationFrame(frame);
    context.revert();
    syncTriggerCount();
  };
  signal.addEventListener('abort', dispose, { once: true });
  try {
    context.add(() => {
      const cover = root.querySelector<HTMLElement>('[data-project-real-cover="true"] .case-cover');
      const heroLayer = cover?.querySelector<HTMLElement>('.case-cover-parallax');
      if (cover && heroLayer) gsap.fromTo(heroLayer, { yPercent: -6, scale: 1.12 }, {
        yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: {
          trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true,
        },
      });
      root.querySelectorAll<HTMLElement>('.case-gallery-parallax').forEach(layer => gsap.fromTo(layer, { yPercent: -3, scale: 1.06 }, {
        yPercent: 3, scale: 1.06, ease: 'none', scrollTrigger: {
          trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true,
        },
      }));
      const next = root.querySelector<HTMLElement>('[data-project-next-reveal]');
      // A late runtime never hides a cover that was already in view.
      if (next && next.getBoundingClientRect().top >= innerHeight) gsap.fromTo(next, { clipPath: 'inset(15% 15% 15% 15%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: {
          trigger: next, start: 'top 90%', end: 'top 25%', scrub: true, invalidateOnRefresh: true,
        },
      });
    });
    syncTriggerCount();
    document.fonts.ready.then(() => {
      if (!alive) return;
      frame = requestAnimationFrame(() => { frame = 0; if (alive) ScrollTrigger.refresh(); });
    }).catch(() => {});
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
