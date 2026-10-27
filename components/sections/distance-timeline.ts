import type { GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';
import { createCrossing } from './distance-crossing';

interface DistanceOptions {
  root: HTMLElement;
  tier: MotionTier;
  /** Phones read the scene as a vertical flow with scroll-linked reveals. */
  narrow: boolean;
  debug: boolean;
  range: (start: number, end: number) => void;
}

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

/** Timeline beats, as fractions of the pinned runway. The trip ends on the far shore and rests there for the
 * last stretch; then the pin lets go and the page keeps scrolling down (no pull-back, no overview). */
const BEAT = {
  pan: .88,
  /** The camera starts tilted and levels out over this part of the trip. */
  level: .45,
} as const;

/** Shape of the dwell around the centred sentence: half-width in trip fractions and how many times
 * longer (in scroll) the trip spends at its centre. */
const DWELL = { width: .22, weight: 5, lead: .03 } as const;

/** Ease for the trip. Time is first cosine-eased (soft start and stop), then warped so the track
 * lingers where the description sits centred. `center` is that point as a fraction of the pan and
 * is re-fed on every measure; `timeAt` gives the (0–1) trip time at which a pan fraction is reached,
 * so reveals can be placed by where things are on screen rather than by guessed numbers. */
function createTravel() {
  const steps = 240;
  const clock = new Float32Array(steps + 1);
  const tick = (i: number) => clock[i] ?? 0;
  const center = (at: number) => {
    let sum = 0;
    for (let i = 1; i <= steps; i += 1) {
      const d = Math.abs((i - .5) / steps - at) / DWELL.width;
      sum += 1 + (d < 1 ? (DWELL.weight - 1) * (.5 + .5 * Math.cos(Math.PI * d)) : 0);
      clock[i] = sum;
    }
    for (let i = 1; i <= steps; i += 1) clock[i] = tick(i) / sum;
  };
  center(.45);
  const clockAt = (x: number) => {
    const f = Math.min(Math.max(x, 0), 1) * steps;
    const i = Math.min(steps - 1, Math.floor(f));
    return tick(i) + (tick(i + 1) - tick(i)) * (f - i);
  };
  const position = (u: number) => {
    let lo = 0;
    let hi = steps;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tick(mid) < u) lo = mid; else hi = mid;
    }
    return (lo + (u - tick(lo)) / (tick(hi) - tick(lo) || 1)) / steps;
  };
  return {
    center,
    ease: (t: number) => position(.5 - .5 * Math.cos(Math.PI * t)),
    timeAt: (x: number) => Math.acos(1 - 2 * clockAt(x)) / Math.PI,
  };
}

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

  if (narrow) {
    return buildFlow({ gsap }, { root, leftLines, rightLines, descriptionWords, connectionWords });
  }

  const runway = one<HTMLElement>('.distance-runway');
  const stage = one<HTMLElement>('.distance-stage');
  const track = one<HTMLElement>('.distance-track');
  const gap = one<HTMLElement>('.distance-gap');
  const rail = one<HTMLElement>('.hud-rail');
  const particle = one<HTMLElement>('.distance-particle');
  if (!runway || !stage || !track || !gap) return () => {};

  const full = tier >= 2;
  const crossing = particle ? createCrossing(gsap, {
    stage, track, gap, particle, thread: one<HTMLElement>('.distance-thread'), anchor: one<HTMLElement>('.distance-anchor'),
  }) : undefined;
  const travel = createTravel();

  let pan = 0;
  let railWidth = 0;
  let sentenceAt = .45;
  const measure = () => {
    const viewport = stage.clientWidth;
    pan = Math.max(0, track.offsetWidth - viewport);
    railWidth = rail?.offsetWidth ?? 0;
    // The sentence sits at the middle of the gap: that is where the trip should linger.
    sentenceAt = pan > 0 ? Math.min(.9, Math.max(.1, (gap.offsetLeft + gap.offsetWidth / 2 - viewport / 2) / pan)) : .45;
    travel.center(sentenceAt + DWELL.lead);
    crossing?.remeasure();
  };
  measure();
  /** Timeline position (in beats) where the trip has covered `x` of the pan. */
  const at = (x: number) => BEAT.pan * travel.timeAt(x);

  // Initial composition for the enhanced scene: lines wait below their clipping boxes.
  gsap.set([...leftLines, ...rightLines, ...descriptionWords], { yPercent: 118 });
  gsap.set(q('.distance-hud'), { autoAlpha: 0 });

  // Before the pin: the first shore rises as the scene scrolls into view. Lenis already smooths the
  // wheel on tier 2, so the scrub follows 1:1 there (a second smoothing layer would trail the scroll).
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: runway, start: 'top 82%', end: 'top 6%', scrub: full ? true : .4, invalidateOnRefresh: true },
  })
    .to(leftLines, { yPercent: 0, stagger: .22, duration: .62, ease: 'power4.out' }, 0)
    .to(q('.distance-hud'), { autoAlpha: 1, duration: .3 }, .35);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: runway, start: 'top top', end: 'bottom bottom', scrub: full ? true : .5, invalidateOnRefresh: true, markers: debug,
      onRefreshInit: measure,
      onRefresh: st => range(st.start, st.end),
    },
  });

  // 1 · El viaje: el contenido avanza en horizontal y cada capa a su velocidad. Arranca y frena suave y se
  // demora donde la descripción queda centrada. La cámara parte inclinada y se endereza.
  gsap.set(track, { transformPerspective: 1500 });
  tl.addLabel('viajar', 0)
    .fromTo(track, { rotationX: 12 }, { rotationX: 0, duration: BEAT.level, ease: 'power1.inOut' }, 0)
    .to(track, { x: () => -pan, duration: BEAT.pan, ease: travel.ease }, 0)
    .fromTo(q('.hud-fill'), { scaleX: 0 }, { scaleX: 1, duration: BEAT.pan }, 0)
    .fromTo(q('.hud-mark'), { x: 0 }, { x: () => railWidth, duration: BEAT.pan }, 0);

  // 2 · La distancia, dicha en voz alta: las palabras suben justo antes de que la frase entre en su remanso,
  // así se lee entera mientras el viaje casi se detiene, y se retiran cuando la frase sale de cuadro.
  tl.addLabel('distancia', at(sentenceAt - .17))
    .to(descriptionWords, { yPercent: 0, stagger: .004, duration: .05, ease: 'power3.out' }, at(sentenceAt - .17))
    .to(descriptionWords, { yPercent: -118, stagger: .003, duration: .04, ease: 'power2.in' }, at(sentenceAt + .34));

  // 3 · La otra orilla aparece como contorno cuando asoma por la derecha y se rellena al llegar.
  tl.addLabel('llegar', at(.43))
    .to(rightLines, { yPercent: 0, stagger: .035, duration: .1, ease: 'power4.out' }, at(.43))
    .to(rightLines, { opacity: 1, duration: BEAT.pan - at(.75), ease: 'power2.inOut' }, at(.75))
    // Reposo en la otra orilla antes de soltar el pin.
    .to({}, { duration: .001 }, .999);

  // 4 · «Ahí trabajamos nosotros.» entra ya en el scroll normal, debajo de la escena fijada.
  rise(gsap, connectionWords, root.querySelector('.distance-connection'), .05, 'top 88%');

  // La partícula sólo se mueve mientras el tramo fijado está en pantalla (incluida la aproximación).
  ScrollTrigger.create({
    trigger: runway, start: 'top bottom', end: 'bottom top',
    onToggle: st => crossing?.setActive(st.isActive),
  });
  const refresh = () => crossing?.remeasure();
  ScrollTrigger.addEventListener('refresh', refresh);
  const uncover = coverHero({ ScrollTrigger }, runway);
  return () => {
    ScrollTrigger.removeEventListener('refresh', refresh);
    crossing?.dispose();
    uncover();
  };
}

/** Telón: el Hero queda fijo (CSS, desde el primer pintado) y la Distancia sube por encima hasta taparlo; recién ahí
 * empieza el viaje horizontal (el pin arranca con la pista en 'top top'). El movimiento y el oscurecido son del
 * navegador (sticky + animación ligada al scroll), sin trabajo por cuadro. Este script sólo comprueba que el Hero
 * entre en la pantalla y, mientras está tapado, lo oculta y pausa su video. */
function coverHero({ ScrollTrigger }: Pick<Runtime, 'ScrollTrigger'>, runway: HTMLElement): () => void {
  const wrapper = runway.closest<HTMLElement>('.hero-cover');
  const hero = wrapper?.querySelector<HTMLElement>('.hero-scene');
  if (!wrapper || !hero) return () => {};
  if (hero.offsetHeight > window.innerHeight + 2) {
    // No entra en la pantalla: el telón dejaría contenido del Hero sin ver; vuelve al flujo normal.
    wrapper.dataset.cover = 'off';
    return () => { delete wrapper.dataset.cover; };
  }
  const video = hero.querySelector<HTMLVideoElement>('[data-hero-video]');
  const hide = (hidden: boolean) => {
    hero.style.visibility = hidden ? 'hidden' : '';
    if (hidden) video?.pause();
    else if (video && !video.ended && video.currentTime > 0) void video.play().catch(() => {});
  };
  const trigger = ScrollTrigger.create({
    trigger: runway, start: 'top top', end: 'bottom top',
    onEnter: () => hide(true), onLeaveBack: () => hide(false),
  });
  return () => {
    trigger.kill();
    hide(false);
  };
}

/** Sube las palabras de su caja de recorte cuando el disparador entra en pantalla (y vuelven a bajar al retroceder). */
function rise(gsap: Runtime['gsap'], targets: Element[], trigger: Element | null, stagger = .08, start = 'top 88%') {
  if (!targets.length || !trigger) return;
  gsap.fromTo(targets, { yPercent: 118 }, {
    yPercent: 0, stagger, duration: 1, ease: 'power4.out',
    scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
  });
}

interface FlowParts {
  root: HTMLElement;
  leftLines: Element[];
  rightLines: Element[];
  descriptionWords: Element[];
  connectionWords: Element[];
}

/** Phones: nothing is pinned. Words rise as they enter and the line toward the closing sentence draws with the scroll. */
function buildFlow({ gsap }: Pick<Runtime, 'gsap'>, parts: FlowParts): () => void {
  const { root, leftLines, rightLines, descriptionWords, connectionWords } = parts;
  rise(gsap, leftLines, root.querySelector('.distance-left .bank-word'));
  rise(gsap, rightLines, root.querySelector('.distance-right .bank-word'));
  rise(gsap, descriptionWords, root.querySelector('.distance-description'), .018, 'top 82%');
  rise(gsap, connectionWords, root.querySelector('.distance-connection'), .05, 'top 90%');

  const vline = root.querySelector('.distance-vline');
  if (vline) {
    gsap.fromTo(vline, { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'center top',
      scrollTrigger: { trigger: vline, start: 'top 92%', end: 'top 55%', scrub: true },
    });
  }
  return () => {};
}
