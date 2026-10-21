import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

/** El Estudio es plano en todos los tamaños: reveals por scroll, sin recorrido fijado. */
export async function mountStudio(root: HTMLElement, signal: AbortSignal) {
  const runtime = await loadGSAP();
  if (signal.aborted || !root.isConnected) return () => {};
  const { gsap, ScrollTrigger } = runtime;
  const context = gsap.context(() => {}, root);
  const cleanup = () => {
    context.revert();
    delete root.dataset.sceneReady;
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  try {
    context.add(() => {
      flowStudio(runtime, root);
      root.dataset.sceneReady = 'true';
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}

/* ───────────────────────── Reveals en flujo ───────────────────────── */

function flowStudio({ gsap }: Runtime, root: HTMLElement) {
  const q = gsap.utils.selector(root);
  q('.es-line').forEach((line, index) => {
    const inner = line.querySelector('.es-line-in');
    gsap.fromTo(inner, { yPercent: 118, x: index === 0 ? -24 : index === 1 ? 24 : 0 }, {
      yPercent: 0, x: 0, duration: 1.1, ease: 'power4.out', delay: index * .08,
      scrollTrigger: { trigger: line, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  });
  const frame = root.querySelector<HTMLElement>('.es-photo-frame');
  const image = root.querySelector<HTMLElement>('.es-photo-frame img');
  if (frame) {
    gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut',
      scrollTrigger: { trigger: frame, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  }
  if (frame && image) {
    gsap.fromTo(image, { yPercent: -6, scale: 1.16 }, {
      yPercent: 6, scale: 1.16, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  // La frase central se enciende palabra por palabra con el scroll.
  const lead = root.querySelector('.es-lead');
  if (lead) {
    gsap.set(q('.es-w'), { opacity: .2 });
    gsap.to(q('.es-w'), {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 48%', scrub: true },
    });
  }
  const paragraph = root.querySelector('.es-paragraph');
  if (paragraph) {
    gsap.fromTo(paragraph, { autoAlpha: 0, y: 20 }, {
      autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: paragraph, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  }
  const bridge = root.querySelector('.es-bridge');
  if (bridge) {
    gsap.fromTo(q('.es-bridge-draw'), { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: bridge, start: 'top 92%', end: 'top 60%', scrub: true },
    });
    gsap.fromTo(q('.es-node'), { scale: 0 }, {
      scale: 1, stagger: .3, duration: .5, ease: 'back.out(2)',
      scrollTrigger: { trigger: bridge, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  }
}
