import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

interface Params {
  runtime: Runtime;
  root: HTMLElement;
  full: boolean;
}

/** Soluciones: reveals por columna e inclinación de las fotos hacia el cursor. */
export async function mountApproach(root: HTMLElement, tier: MotionTier, signal: AbortSignal) {
  const runtime = await loadGSAP();
  if (signal.aborted || !root.isConnected) return () => {};
  const { gsap, ScrollTrigger } = runtime;
  const context = gsap.context(() => {}, root);
  let extra = () => {};
  const cleanup = () => {
    extra();
    context.revert();
    delete root.dataset.sceneReady;
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  try {
    context.add(() => {
      extra = flowSolutions({ runtime, root, full: tier >= 2 });
      root.dataset.sceneReady = 'true';
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}

/* ───────────────────────── Soluciones · plana ───────────────────────── */

function flowSolutions({ runtime: { gsap }, root, full }: Params): () => void {
  const rise = (targets: Element | Element[] | NodeListOf<Element>, trigger: Element, start = 'top 85%', stagger = .08) => {
    gsap.fromTo(targets, { yPercent: 118 }, {
      yPercent: 0, stagger, duration: 1, ease: 'power4.out',
      scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
    });
  };
  const head = root.querySelector('.ap-sol-head');
  if (head) rise(head.querySelectorAll('.ap-line-in'), head, 'top 88%', .12);

  // Las tarjetas comparten fila en pantallas anchas: el retraso escalona sólo dentro de la fila.
  const columns = innerWidth >= 1100 ? 4 : innerWidth >= 768 ? 2 : 1;
  root.querySelectorAll<HTMLElement>('.ap-service').forEach((service, index) => {
    const delay = (index % columns) * .12;
    const slide = service.querySelector<HTMLElement>('.ap-slide');
    const image = service.querySelector<HTMLElement>('.ap-slide img');
    const name = service.querySelector('.ap-name .ap-line-in');
    if (slide) {
      gsap.fromTo(slide, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, delay, ease: 'power3.inOut',
        scrollTrigger: { trigger: service, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    }
    if (slide && image) {
      gsap.fromTo(image, { yPercent: -5, scale: 1.16 }, {
        yPercent: 5, scale: 1.16, ease: 'none',
        scrollTrigger: { trigger: slide, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
    if (name) {
      gsap.fromTo(name, { yPercent: 118 }, {
        yPercent: 0, duration: 1, delay: delay + .25, ease: 'power4.out',
        scrollTrigger: { trigger: service, start: 'top 80%', toggleActions: 'play none none reverse' },
      });
    }
    gsap.fromTo(service.querySelectorAll('.ap-full, .ap-desc'), { autoAlpha: 0, y: 16 }, {
      autoAlpha: 1, y: 0, stagger: .1, duration: .8, delay: delay + .35, ease: 'power3.out',
      scrollTrigger: { trigger: service, start: 'top 78%', toggleActions: 'play none none reverse' },
    });
  });
  const ai = root.querySelector('.ap-ai');
  if (ai) rise(ai.querySelectorAll('.ap-line-in'), ai, 'top 80%', .14);

  // Perspectiva: cada foto se inclina hacia el cursor y el brillo la sigue (sólo puntero fino y tier completo).
  const listeners: Array<() => void> = [];
  if (full && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    root.querySelectorAll<HTMLElement>('.ap-service').forEach(service => {
      const media = service.querySelector<HTMLElement>('.ap-service-media');
      const slide = service.querySelector<HTMLElement>('.ap-slide');
      if (!media || !slide) return;
      gsap.set(media, { transformPerspective: 900 });
      const rotY = gsap.quickTo(media, 'rotationY', { duration: .6, ease: 'power3.out' });
      const rotX = gsap.quickTo(media, 'rotationX', { duration: .6, ease: 'power3.out' });
      const move = (event: PointerEvent) => {
        const box = media.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
        const py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
        rotY((px - .5) * 14);
        rotX(-(py - .5) * 11);
        slide.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        slide.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      };
      const leave = () => { rotY(0); rotX(0); };
      service.addEventListener('pointermove', move, { passive: true });
      service.addEventListener('pointerleave', leave);
      listeners.push(() => { service.removeEventListener('pointermove', move); service.removeEventListener('pointerleave', leave); });
    });
  }
  return () => listeners.forEach(off => off());
}
