import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

interface Params {
  runtime: Runtime;
  root: HTMLElement;
  full: boolean;
}

/** Soluciones: reveal del encabezado; las tarjetas se revelan por clase (ver styles/approach.css). */
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

function flowSolutions({ runtime: { gsap }, root }: Params): () => void {
  const rise = (targets: Element | Element[] | NodeListOf<Element>, trigger: Element, start = 'top 85%', stagger = .08) => {
    gsap.fromTo(targets, { yPercent: 118 }, {
      yPercent: 0, stagger, duration: 1, ease: 'power4.out',
      scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
    });
  };
  const head = root.querySelector('.ap-sol-head');
  if (head) rise(head.querySelectorAll('.ap-line-in'), head, 'top 88%', .12);

  // Tarjetas: revelado por clase (CSS) con IntersectionObserver, como la referencia (umbral .14, margen −40 px).
  // La lista marca data-live mientras está en pantalla: fuera de ella, las animaciones continuas se pausan.
  const list = root.querySelector<HTMLElement>('.ap-services');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.ap-service'));
  let reveal: IntersectionObserver | undefined;
  let live: IntersectionObserver | undefined;
  if (list && cards.length) {
    list.dataset.trio = 'ready';
    reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      reveal?.unobserve(entry.target);
    }), { threshold: .14, rootMargin: '0px 0px -40px 0px' });
    cards.forEach(card => reveal?.observe(card));
    live = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) list.dataset.live = 'true'; else delete list.dataset.live;
    });
    live.observe(list);
  }

  return () => {
    reveal?.disconnect();
    live?.disconnect();
    if (list) { delete list.dataset.trio; delete list.dataset.live; }
    cards.forEach(card => card.classList.remove('in'));
  };
}
