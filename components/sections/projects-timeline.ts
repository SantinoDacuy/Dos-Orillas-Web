import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export async function mountProjects(root: HTMLElement, tier: MotionTier, mode: 'pinned' | 'flow', signal: AbortSignal) {
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
      const full = tier >= 2;
      extra = mode === 'pinned' ? pinnedDeck(runtime, root, full) : flowProjects(runtime, root);
      root.dataset.sceneReady = 'true';
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}

/* ───────────────────────── Mazo fijado (desktop) ───────────────────────── */

function pinnedDeck({ gsap, ScrollTrigger }: Runtime, root: HTMLElement, full: boolean): () => void {
  const q = gsap.utils.selector(root);
  const stage = root.querySelector<HTMLElement>('.pj-stage');
  const items = q('.pj-item');
  const count = items.length;
  if (!stage || count < 2) return () => {};
  const pick = <T extends HTMLElement>(selector: string) => items.map(item => item.querySelector<T>(selector)!);
  const cards = pick('.pj-card');
  const infos = pick('.pj-info');
  const links = pick<HTMLAnchorElement>('.pj-card-link');
  const covers = pick('.pj-cover');
  // La inclinación se aplica a la propia portada (el elemento del portal); se aplana antes del clic.
  const tilts = covers;
  const nameIn = pick('.pj-name .pj-line-in');
  const ambients = q('.pj-ambient');
  const railItems = Array.from(root.querySelectorAll<HTMLButtonElement>('.pj-rail-item'));
  const railFill = root.querySelector<HTMLElement>('.pj-rail-fill');
  const counter = root.querySelector<HTMLElement>('.pj-counter-now');
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('.pj-step'));

  let cardWidth = 0;
  let activeIndex = -1;
  let target = 0;
  let pos = 0;
  let ticking = false;
  const measure = () => { cardWidth = cards[0]!.offsetWidth; };
  measure();

  gsap.set(tilts, { transformPerspective: 1100 });
  gsap.set(q('.pj-title .pj-line-in'), { yPercent: 118 });
  gsap.set(q('.pj-eyebrow,.pj-all,.pj-controls'), { autoAlpha: 0 });

  const render = (value: number) => {
    const index = clamp(Math.round(value), 0, count - 1);
    for (let i = 0; i < count; i++) {
      const d = i - value;
      const ahead = d >= 0;
      const distance = Math.abs(d);
      const opacity = ahead ? 1 - Math.min(d, 2.2) * .3 : 1 + d * 1.7;
      gsap.set(cards[i]!, {
        x: ahead ? d * cardWidth * .7 : d * cardWidth * 1.05,
        z: ahead ? -d * 280 : d * 140,
        rotationY: ahead ? -Math.min(d, 1.4) * 30 : -d * 24,
        scale: ahead ? 1 - Math.min(d, 2) * .1 : 1 - Math.min(distance, 1) * .08,
        autoAlpha: Math.max(0, opacity),
      });
      const t = clamp(1 - distance * 2.1);
      gsap.set(infos[i]!, { autoAlpha: t, y: d * 46 });
      gsap.set(nameIn[i]!, { yPercent: (1 - t) * (d >= 0 ? 60 : -60) });
      gsap.set(ambients[i]!, { opacity: clamp(1 - distance) * .9 });
    }
    if (index !== activeIndex) {
      activeIndex = index;
      cards.forEach((card, i) => { card.dataset.active = String(i === index); links[i]!.tabIndex = i === index ? 0 : -1; });
      railItems.forEach((button, i) => { button.dataset.active = String(i === index); if (i === index) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      tilts.forEach((tilt, i) => { if (i !== index) gsap.to(tilt, { rotationX: 0, rotationY: 0, duration: .5, ease: 'power3.out', overwrite: 'auto' }); });
    }
    if (railFill) gsap.set(railFill, { scaleX: value / (count - 1) });
  };

  // Inercia propia sobre el progreso: el scroll fija el destino y el mazo lo alcanza suavemente.
  const tick = (_time: number, delta: number) => {
    const dt = Math.min(delta, 64) / 1000;
    pos += (target - pos) * (1 - Math.exp(-dt * (full ? 14 : 9)));
    if (Math.abs(target - pos) < .0006) {
      pos = target;
      gsap.ticker.remove(tick);
      ticking = false;
    }
    render(pos);
  };
  const wake = () => { if (!ticking) { ticking = true; gsap.ticker.add(tick); } };
  /** Progreso → posición del mazo, con una meseta en cada proyecto. */
  const shape = (progress: number) => {
    const raw = clamp(progress) * (count - 1);
    const base = Math.min(Math.floor(raw), count - 2);
    return base + smoother(clamp((raw - base - .2) / .6));
  };

  const trigger = ScrollTrigger.create({
    trigger: root, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
    onRefreshInit: measure,
    onRefresh: self => { target = shape(self.progress); pos = target; render(pos); },
    onUpdate: self => { target = shape(self.progress); wake(); },
  });
  render(0);

  // Entrada previa al pin: el título sube línea por línea mientras la escena llega.
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top 80%', end: 'top 8%', scrub: full ? .6 : .4 } })
    .to(q('.pj-title .pj-line-in'), { yPercent: 0, duration: .6, ease: 'power4.out' }, 0)
    .to(q('.pj-eyebrow'), { autoAlpha: 1, duration: .3 }, .2)
    .to(q('.pj-all'), { autoAlpha: 1, duration: .3 }, .4)
    .to(q('.pj-controls'), { autoAlpha: 1, duration: .3 }, .55);

  const goTo = (index: number) => {
    const i = clamp(index, 0, count - 1);
    const y = trigger.start + (trigger.end - trigger.start) * (i / (count - 1));
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const listeners: Array<() => void> = [];
  const on = <E extends HTMLElement | Window | Document>(el: E, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
    el.addEventListener(type, handler, options);
    listeners.push(() => el.removeEventListener(type, handler, options));
  };
  railItems.forEach((button, i) => on(button, 'click', () => goTo(i)));
  steps.forEach(button => on(button, 'click', () => goTo(activeIndex + Number(button.dataset.step))));
  links.forEach((link, i) => {
    // Un clic en una portada que asoma no abre el caso: la trae al centro.
    on(link, 'click', event => { if (i !== activeIndex) { event.preventDefault(); goTo(i); } });
    on(link, 'focus', () => { if (i !== activeIndex) goTo(i); });
    // La portada activa se aplana antes del clic: el portal parte desde una geometría limpia.
    on(link, 'pointerdown', () => { gsap.killTweensOf(tilts[i]!); gsap.set(tilts[i]!, { rotationX: 0, rotationY: 0 }); });
  });
  on(window, 'keydown', event => {
    const key = (event as KeyboardEvent).key;
    const el = document.activeElement;
    if ((key !== 'ArrowRight' && key !== 'ArrowLeft') || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || !trigger.isActive) return;
    event.preventDefault();
    goTo(activeIndex + (key === 'ArrowRight' ? 1 : -1));
  });

  // Perspectiva hacia el puntero sobre la portada activa (sólo puntero fino y tier completo).
  if (full && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const move = (event: Event) => {
      const { clientX, clientY } = event as PointerEvent;
      const cover = covers[activeIndex];
      const tilt = tilts[activeIndex];
      if (!cover || !tilt) return;
      const box = cover.getBoundingClientRect();
      const px = clamp((clientX - box.left) / box.width);
      const py = clamp((clientY - box.top) / box.height);
      gsap.to(tilt, { rotationY: (px - .5) * 13, rotationX: -(py - .5) * 10, duration: .6, ease: 'power3.out', overwrite: 'auto' });
      cover.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      cover.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const leave = () => { const tilt = tilts[activeIndex]; if (tilt) gsap.to(tilt, { rotationX: 0, rotationY: 0, duration: .8, ease: 'power3.out', overwrite: 'auto' }); };
    on(stage, 'pointermove', move, { passive: true });
    on(stage, 'pointerleave', leave);
  }

  return () => {
    listeners.forEach(off => off());
    gsap.ticker.remove(tick);
    trigger.kill();
  };
}

/* ───────────────────────── Flujo (tablet y móvil) ───────────────────────── */

function flowProjects({ gsap }: Runtime, root: HTMLElement): () => void {
  const rise = (targets: Element | Element[] | NodeListOf<Element>, trigger: Element, start = 'top 85%', stagger = .1) => {
    gsap.fromTo(targets, { yPercent: 118 }, {
      yPercent: 0, stagger, duration: 1, ease: 'power4.out',
      scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
    });
  };
  const head = root.querySelector('.pj-head');
  if (head) rise(head.querySelectorAll('.pj-line-in'), head, 'top 88%');

  root.querySelectorAll<HTMLElement>('.pj-item').forEach(item => {
    const cover = item.querySelector<HTMLElement>('.pj-cover');
    const media = item.querySelector<HTMLElement>('.pj-media');
    const name = item.querySelector('.pj-name .pj-line-in');
    if (name) rise(name, item, 'top 70%');
    gsap.fromTo(item.querySelectorAll('.pj-category, .pj-summary, .pj-pills, .pj-actions'), { autoAlpha: 0, y: 20 }, {
      autoAlpha: 1, y: 0, stagger: .08, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 62%', toggleActions: 'play none none reverse' },
    });
    if (cover) {
      gsap.fromTo(cover, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: cover, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    }
    if (cover && media) {
      gsap.fromTo(media, { yPercent: -5, scale: 1.14 }, {
        yPercent: 5, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });
  return () => {};
}
