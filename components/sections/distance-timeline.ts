import type { GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';
import { createRiver } from './distance-river';

interface DistanceOptions {
  root: HTMLElement;
  tier: MotionTier;
  /** Phones read the scene as a vertical flow with scroll-linked reveals. */
  narrow: boolean;
  debug: boolean;
  range: (start: number, end: number) => void;
}

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

/** Timeline beats, as fractions of the pinned runway. */
const BEAT = {
  pan: .56,
  descriptionIn: .13,
  rightIn: .27,
  rightFill: .42,
  zoom: .58,
  zoomLength: .28,
  deck: .7,
  cable: .76,
  hangers: .8,
  outro: .86,
} as const;

/** Builds the Distance scene inside the caller's gsap.context and returns extra cleanup
 * for what the context cannot revert (ticker callbacks, observers). */
export function buildDistance({ gsap, ScrollTrigger }: Runtime, options: DistanceOptions): () => void {
  const { root, tier, narrow, debug, range } = options;
  const q = gsap.utils.selector(root);
  const one = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const leftLines = q('.distance-left .line-in');
  const rightLines = q('.distance-right .line-in');
  const descriptionWords = q('.distance-description .dw-in');
  const connectionWords = q('.distance-connection .dw-in');

  if (narrow) return buildFlow({ gsap, ScrollTrigger }, { root, leftLines, rightLines, descriptionWords, connectionWords });

  const stage = one<HTMLElement>('.distance-stage');
  const track = one<HTMLElement>('.distance-track');
  const gap = one<HTMLElement>('.distance-gap');
  const aerial = one<HTMLElement>('.distance-aerial');
  const near = q('.distance-ruler, .distance-gap-label');
  const rail = one<HTMLElement>('.hud-rail');
  const canvas = one<HTMLCanvasElement>('.distance-river');
  if (!stage || !track || !gap) return () => {};

  const full = tier >= 2;
  const river = full && canvas ? createRiver(gsap, { stage, track, gap, canvas }) : undefined;

  let pan = 0;
  let fit = .4;
  let railWidth = 0;
  const measure = () => {
    const viewport = stage.clientWidth;
    const length = track.offsetWidth;
    pan = Math.max(0, length - viewport);
    fit = Math.min(1, viewport / Math.max(1, length));
    railWidth = rail?.offsetWidth ?? 0;
    river?.remeasure();
  };
  measure();

  // Initial composition for the enhanced scene: lines wait below their clipping boxes.
  gsap.set([...leftLines, ...rightLines, ...descriptionWords, ...connectionWords], { yPercent: 118 });
  gsap.set(q('.bridge-deck,.bridge-pylon,.bridge-cable,.bridge-hanger'), { strokeDashoffset: 1 });
  gsap.set(q('.bank-label,.distance-hud'), { autoAlpha: 0 });
  gsap.set(q('.distance-bank'), { '--bank-line': 0 });
  const bankLines = q('.distance-bank');

  // Before the pin: the first shore rises as the scene scrolls into view.
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top 82%', end: 'top 6%', scrub: full ? .6 : .4, invalidateOnRefresh: true },
  })
    .to(leftLines, { yPercent: 0, stagger: .22, duration: .62, ease: 'power4.out' }, 0)
    .to(q('.distance-left .bank-label,.distance-hud'), { autoAlpha: 1, duration: .3 }, .35);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: 'top top', end: 'bottom bottom', scrub: full ? true : .5, invalidateOnRefresh: true, markers: debug,
      onRefreshInit: measure,
      onRefresh: st => range(st.start, st.end),
      onUpdate: st => river?.pulse(st.getVelocity()),
    },
  });

  // 1 · El viaje: el contenido avanza en horizontal y cada capa a su velocidad.
  tl.addLabel('viajar', 0)
    .to(track, { x: () => -pan, duration: BEAT.pan }, 0)
    .fromTo(aerial, { x: () => -pan * .1 }, { x: () => pan * .1, duration: BEAT.pan }, 0)
    .fromTo(near, { x: () => pan * .1 }, { x: () => -pan * .1, duration: BEAT.pan }, 0)
    .fromTo(q('.hud-fill'), { scaleX: 0 }, { scaleX: 1, duration: BEAT.zoom + BEAT.zoomLength * .5 }, 0)
    .fromTo(q('.hud-mark'), { x: 0 }, { x: () => railWidth, duration: BEAT.zoom + BEAT.zoomLength * .5 }, 0);

  // 2 · La distancia, dicha en voz alta.
  tl.addLabel('distancia', BEAT.descriptionIn)
    .to(descriptionWords, { yPercent: 0, stagger: .007, duration: .07, ease: 'power3.out' }, BEAT.descriptionIn)
    .to(descriptionWords, { yPercent: -118, stagger: .003, duration: .05, ease: 'power2.in' }, .47);

  // 3 · La otra orilla aparece como contorno y se rellena al llegar.
  tl.addLabel('llegar', BEAT.rightIn)
    .to(q('.distance-right .bank-label'), { autoAlpha: 1, duration: .05 }, BEAT.rightIn)
    .to(rightLines, { yPercent: 0, stagger: .035, duration: .1, ease: 'power4.out' }, BEAT.rightIn)
    .to(rightLines, { color: '#F2EEE6', duration: .1, ease: 'power2.inOut' }, BEAT.rightFill);

  // 4 · La cámara se aleja: ambas orillas entran en cuadro.
  tl.addLabel('alejar', BEAT.zoom)
    .fromTo(track, { x: () => -pan, y: 0, scaleX: 1, scaleY: 1 },
      { x: 0, y: () => -innerHeight * .1, scaleX: () => fit, scaleY: () => fit, duration: BEAT.zoomLength, ease: 'power2.inOut', immediateRender: false }, BEAT.zoom)
    .to(aerial, { x: 0, duration: BEAT.zoomLength, ease: 'power2.inOut' }, BEAT.zoom)
    .to(near, { x: 0, duration: BEAT.zoomLength, ease: 'power2.inOut' }, BEAT.zoom)
    .to(q('.bank-label'), { autoAlpha: 0, duration: .06 }, BEAT.zoom)
    .to(q('.distance-gap-label'), { autoAlpha: 0, duration: .06 }, BEAT.zoom + .12)
    .to(bankLines, { '--bank-line': 1, duration: .1 }, BEAT.zoom + .06);

  // 5 · El puente se dibuja de orilla a orilla.
  tl.addLabel('conectar', BEAT.deck)
    .to(q('.bridge-deck'), { strokeDashoffset: 0, duration: .12, ease: 'power2.inOut' }, BEAT.deck)
    .to(q('.bridge-pylon'), { strokeDashoffset: 0, duration: .06, stagger: .02, ease: 'power2.out' }, BEAT.cable - .02)
    .to(q('.bridge-cable'), { strokeDashoffset: 0, duration: .1, ease: 'power2.inOut' }, BEAT.cable)
    .to(q('.bridge-hanger'), { strokeDashoffset: 0, duration: .04, stagger: { each: .0035, from: 'edges' }, ease: 'power2.out' }, BEAT.hangers);

  // 6 · Ahí trabajamos nosotros.
  tl.addLabel('resolver', BEAT.outro)
    .to(connectionWords, { yPercent: 0, stagger: .012, duration: .05, ease: 'power3.out' }, BEAT.outro)
    .to({}, { duration: .01 }, .99);

  // The river only draws while the scene is on screen, including the approach before the pin.
  if (river) ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: st => river.setActive(st.isActive) });

  const refresh = () => river?.remeasure();
  ScrollTrigger.addEventListener('refresh', refresh);
  return () => {
    ScrollTrigger.removeEventListener('refresh', refresh);
    river?.dispose();
  };
}

interface FlowParts {
  root: HTMLElement;
  leftLines: Element[];
  rightLines: Element[];
  descriptionWords: Element[];
  connectionWords: Element[];
}

/** Phones: nothing is pinned. Words rise as they enter, the aerial drifts and the line
 * toward the closing sentence draws with the scroll. */
function buildFlow({ gsap }: Runtime, parts: FlowParts): () => void {
  const { root, leftLines, rightLines, descriptionWords, connectionWords } = parts;
  const rise = (targets: Element[], trigger: Element | null, stagger = .08, start = 'top 88%') => {
    if (!targets.length || !trigger) return;
    gsap.fromTo(targets, { yPercent: 118 }, {
      yPercent: 0, stagger, duration: 1, ease: 'power4.out',
      scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
    });
  };
  rise(leftLines, root.querySelector('.distance-left .bank-word'));
  rise(rightLines, root.querySelector('.distance-right .bank-word'));
  rise(descriptionWords, root.querySelector('.distance-description'), .018, 'top 82%');
  rise(connectionWords, root.querySelector('.distance-connection'), .05, 'top 90%');

  const aerialImage = root.querySelector('.distance-aerial img');
  const gap = root.querySelector('.distance-gap');
  if (aerialImage && gap) {
    gsap.fromTo(aerialImage, { yPercent: -7, scale: 1.14 }, {
      yPercent: 7, scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: gap, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  const vline = root.querySelector('.distance-vline');
  if (vline) {
    gsap.fromTo(vline, { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'center top',
      scrollTrigger: { trigger: vline, start: 'top 92%', end: 'top 55%', scrub: true },
    });
  }
  return () => {};
}
