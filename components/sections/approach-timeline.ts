import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;
type Scene = 'manifiesto' | 'soluciones';
type Mode = 'pinned' | 'flow';

interface Params {
  runtime: Runtime;
  root: HTMLElement;
  full: boolean;
  debug: boolean;
}

/** Distance from `node` to `ancestor`'s top edge without reading transformed rects. */
function offsetWithin(node: HTMLElement, ancestor: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = node;
  while (current && current !== ancestor) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

export async function mountApproach(root: HTMLElement, scene: Scene, tier: MotionTier, mode: Mode, signal: AbortSignal) {
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
      const params: Params = { runtime, root, full: tier >= 2, debug: new URLSearchParams(location.search).has('debug') };
      if (scene === 'manifiesto') extra = mode === 'pinned' ? pinnedManifesto(params) : flowManifesto(params);
      else extra = flowSolutions(params);
      root.dataset.sceneReady = 'true';
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}

/* ───────────────────────── Manifiesto · recorrido fijado ───────────────────────── */

function pinnedManifesto({ runtime: { gsap }, root, full, debug }: Params): () => void {
  const q = gsap.utils.selector(root);
  const stage = root.querySelector<HTMLElement>('.ap-stage');
  const beatB = root.querySelector<HTMLElement>('.ap-beat-b');
  const strike = root.querySelector<HTMLElement>('.ap-strike');
  if (!stage || !beatB || !strike) return () => {};
  const linesA = q('.ap-statement-a .ap-line-in');
  const linesB = q('.ap-statement-b .ap-line-in');

  let stageHeight = 0;
  let strikeY = 0;
  const measure = () => {
    stageHeight = stage.clientHeight;
    strikeY = offsetWithin(strike, stage) + strike.offsetHeight / 2;
  };
  measure();

  gsap.set([...linesA, ...linesB], { yPercent: 118 });
  gsap.set(q('.ap-strike,.ap-underline'), { scaleX: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: full ? true : .5, invalidateOnRefresh: true, onRefreshInit: measure, markers: debug },
  });

  // 1 · «NO HACEMOS TECNOLOGÍA PORQUE SÍ.» sobre la foto abstracta.
  tl.addLabel('premisa', 0)
    .fromTo(q('.ap-beat-a .ap-photo'), { opacity: 0 }, { opacity: 1, duration: .1 }, 0)
    .fromTo(q('.ap-beat-a .ap-photo img'), { scale: 1.16 }, { scale: 1.04, duration: .5 }, 0)
    .fromTo(q('.ap-telemetry'), { opacity: 0 }, { opacity: 1, duration: .08 }, .03)
    .to(linesA, { yPercent: 0, stagger: .035, duration: .11, ease: 'power4.out' }, .03);

  // 2 · La línea tacha «PORQUE SÍ.» y se convierte en la ventana a la segunda toma.
  tl.addLabel('tachar', .2)
    .fromTo(q('.ap-strike'), { scaleX: 0 }, { scaleX: 1, duration: .1, ease: 'power2.inOut' }, .2)
    .fromTo(beatB, { clipPath: () => `inset(${strikeY}px 0px ${Math.max(0, stageHeight - strikeY)}px 0px)` },
      { clipPath: 'inset(0px 0px 0px 0px)', duration: .22, ease: 'power2.inOut' }, .32)
    .fromTo(q('.ap-beat-b .ap-photo img'), { scale: 1.24 }, { scale: 1.02, duration: .68 }, .32)
    .to(linesA, { yPercent: -118, stagger: .03, duration: .09, ease: 'power2.in' }, .4);

  // 3 · «LA HACEMOS CUANDO PUEDE MEJORAR ALGO.»
  tl.addLabel('resolver', .5)
    .to(linesB, { yPercent: 0, stagger: .05, duration: .12, ease: 'power4.out' }, .5)
    .fromTo(q('.ap-underline'), { scaleX: 0 }, { scaleX: 1, duration: .09, ease: 'power2.inOut' }, .66)
    .to(q('.ap-dusk'), { opacity: .9, duration: .12 }, .86)
    .to({}, { duration: .01 }, .99);
  return () => {};
}

/* ───────────────────────── Manifiesto · móvil en flujo ───────────────────────── */

function flowManifesto({ runtime: { gsap }, root }: Params): () => void {
  root.querySelectorAll<HTMLElement>('.ap-beat').forEach(beat => {
    const lines = beat.querySelectorAll<HTMLElement>('.ap-line-in');
    gsap.fromTo(lines, { yPercent: 118 }, {
      yPercent: 0, stagger: .09, duration: 1.1, ease: 'power4.out',
      scrollTrigger: { trigger: beat, start: 'top 55%', toggleActions: 'play none none reverse' },
    });
    const image = beat.querySelector<HTMLElement>('.ap-photo img');
    if (image) {
      gsap.fromTo(image, { yPercent: -7, scale: 1.16 }, {
        yPercent: 7, scale: 1.16, ease: 'none',
        scrollTrigger: { trigger: beat, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });
  const strike = root.querySelector<HTMLElement>('.ap-strike');
  if (strike) {
    gsap.fromTo(strike, { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: strike, start: 'top 75%', end: 'top 45%', scrub: true },
    });
  }
  const underline = root.querySelector<HTMLElement>('.ap-underline');
  if (underline) {
    gsap.fromTo(underline, { scaleX: 0 }, {
      scaleX: 1, duration: .9, ease: 'power2.inOut',
      scrollTrigger: { trigger: underline, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  }
  return () => {};
}

/* ───────────────────────── Soluciones · plana ───────────────────────── */

function flowSolutions({ runtime: { gsap }, root }: Params): () => void {
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
  return () => {};
}
