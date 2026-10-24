import { loadGSAP, type GSAPRuntime } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

type Runtime = Pick<GSAPRuntime, 'gsap' | 'ScrollTrigger'>;
type Mode = 'deck' | 'slide';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** El carrusel se maneja con flechas, riel, teclado o arrastre: el scroll no lo mueve. */
export async function mountProjects(root: HTMLElement, tier: MotionTier, mode: Mode, signal: AbortSignal) {
  const runtime = await loadGSAP();
  if (signal.aborted || !root.isConnected) return () => {};
  const { gsap, ScrollTrigger } = runtime;
  const context = gsap.context(() => {}, root);
  let extra = () => {};
  const cleanup = () => {
    extra();
    context.revert();
    delete root.dataset.sceneReady;
    delete root.dataset.pjMode;
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  try {
    context.add(() => {
      const full = tier >= 2;
      extra = carousel(runtime, root, full, mode);
      root.dataset.pjMode = mode;
      root.dataset.sceneReady = 'true';
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}

function carousel({ gsap }: Runtime, root: HTMLElement, full: boolean, mode: Mode): () => void {
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
  const nameIn = pick('.pj-name .pj-line-in');
  const ambients = q('.pj-ambient');
  const railItems = Array.from(root.querySelectorAll<HTMLButtonElement>('.pj-rail-item'));
  const railFill = root.querySelector<HTMLElement>('.pj-rail-fill');
  const counter = root.querySelector<HTMLElement>('.pj-counter-now');
  const stepButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.pj-step'));
  const shortNames = railItems.map(button => button.querySelector('.pj-rail-name')?.textContent?.trim() ?? '');

  let cardWidth = 0;
  let index = 0;
  let activeIndex = -1;
  const state = { pos: 0 };
  let tween: ReturnType<typeof gsap.to> | undefined;
  const measure = () => { cardWidth = cards[0]!.offsetWidth; };
  measure();

  if (mode === 'deck') gsap.set(covers, { transformPerspective: 1100 });
  gsap.set(q('.pj-title .pj-line-in'), { yPercent: 118 });
  gsap.set(q('.pj-all,.pj-controls'), { autoAlpha: 0 });

  /** Estado del mazo para una posición fraccionaria. Todas las portadas son opacas: la jerarquía sale
   * de la escala, la profundidad, el orden de apilado y un velo oscuro, nunca de la transparencia. */
  const renderDeck = (value: number) => {
    for (let i = 0; i < count; i++) {
      const d = i - value;
      const ahead = d >= 0;
      const distance = Math.abs(d);
      const shown = d > -.8 && d < 2.6;
      gsap.set(cards[i]!, {
        x: ahead ? d * cardWidth * .66 : d * cardWidth * 1.2,
        z: ahead ? -d * 260 : d * 140,
        rotationY: ahead ? -Math.min(d, 1.4) * 28 : -d * 24,
        scale: ahead ? 1 - Math.min(d, 2) * .09 : 1 - Math.min(distance, 1) * .08,
        zIndex: 30 - Math.round(distance * 6) - (ahead ? 0 : 3),
        visibility: shown ? 'visible' : 'hidden',
        '--dim': ahead ? clamp(distance * .5, 0, .78) : clamp(distance * 1.25, 0, 1),
      });
      const t = clamp(1 - distance * 2.1);
      gsap.set(infos[i]!, { autoAlpha: t, y: d * 46 });
      gsap.set(nameIn[i]!, { yPercent: (1 - t) * (d >= 0 ? 60 : -60) });
      gsap.set(ambients[i]!, { opacity: clamp(1 - distance) * .9 });
    }
  };

  /** Una sola portada visible por vez: la saliente se desliza hacia un lado y la entrante llega del otro. */
  const renderSlide = (value: number) => {
    for (let i = 0; i < count; i++) {
      const d = i - value;
      const visible = clamp(1 - Math.abs(d) * 1.6);
      gsap.set(items[i]!, { xPercent: d * 36, autoAlpha: visible });
    }
  };
  const render = (value: number) => {
    if (mode === 'deck') renderDeck(value); else renderSlide(value);
    if (railFill) gsap.set(railFill, { scaleX: value / (count - 1) });
  };

  /** Todo lo que no es movimiento continuo: estado activo, contador, etiquetas de las flechas, foco. */
  const applyIndex = (value: number) => {
    if (value === activeIndex) return;
    activeIndex = value;
    cards.forEach((card, i) => { card.dataset.active = String(i === value); links[i]!.tabIndex = i === value ? 0 : -1; });
    items.forEach((item, i) => { item.setAttribute('aria-hidden', String(mode === 'slide' && i !== value)); if (mode === 'slide') item.toggleAttribute('inert', i !== value); });
    railItems.forEach((button, i) => { button.dataset.active = String(i === value); if (i === value) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
    if (counter) counter.textContent = String(value + 1).padStart(2, '0');
    stepButtons.forEach(button => {
      const target = value + Number(button.dataset.step);
      const label = button.querySelector('.pj-step-label');
      const exists = target >= 0 && target < count;
      button.disabled = !exists;
      if (label && exists) label.textContent = shortNames[target] || (Number(button.dataset.step) > 0 ? 'Siguiente' : 'Anterior');
      button.setAttribute('aria-label', exists ? `${Number(button.dataset.step) > 0 ? 'Siguiente' : 'Anterior'}: ${shortNames[target] || ''}` : (Number(button.dataset.step) > 0 ? 'No hay más proyectos' : 'Es el primer proyecto'));
    });
    covers.forEach((cover, i) => { if (i !== value) gsap.to(cover, { rotationX: 0, rotationY: mode === 'deck' ? 0 : 0, duration: .5, ease: 'power3.out', overwrite: 'auto' }); });
  };

  const go = (target: number, immediate = false) => {
    const next = clamp(Math.round(target), 0, count - 1);
    index = next;
    applyIndex(next);
    tween?.kill();
    if (immediate) { state.pos = next; render(next); return; }
    tween = gsap.to(state, { pos: next, duration: full ? .95 : .7, ease: 'power3.inOut', onUpdate: () => render(state.pos) });
  };
  const step = (delta: number) => go(index + delta);

  render(0);
  applyIndex(0);

  // Entrada única al acercarse: el título sube línea por línea y aparecen los controles.
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none none' } })
    .to(q('.pj-title .pj-line-in'), { yPercent: 0, duration: 1, ease: 'power4.out' }, 0)
    .to(q('.pj-all'), { autoAlpha: 1, duration: .6 }, .25)
    .to(q('.pj-controls'), { autoAlpha: 1, duration: .6 }, .4);

  const listeners: Array<() => void> = [];
  const on = <E extends HTMLElement | Window | Document>(el: E, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
    el.addEventListener(type, handler, options);
    listeners.push(() => el.removeEventListener(type, handler, options));
  };
  railItems.forEach((button, i) => on(button, 'click', () => go(i)));
  stepButtons.forEach(button => on(button, 'click', () => step(Number(button.dataset.step))));

  // Clic en una portada que asoma: la trae al centro en lugar de abrir el caso.
  let dragged = false;
  links.forEach((link, i) => {
    on(link, 'click', event => {
      if (dragged) { event.preventDefault(); return; }
      if (i !== index) { event.preventDefault(); go(i); }
    });
    on(link, 'focus', () => { if (i !== index) go(i); });
    // La portada activa se aplana antes del clic: el portal parte desde una geometría limpia.
    on(link, 'pointerdown', () => { gsap.killTweensOf(covers[i]!); gsap.set(covers[i]!, { rotationX: 0, rotationY: 0 }); });
  });

  // Teclado: sólo cuando la sección está en pantalla.
  let visible = false;
  const watcher = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, { threshold: .35 });
  watcher.observe(root);
  on(window, 'keydown', event => {
    const key = (event as KeyboardEvent).key;
    const el = document.activeElement;
    if ((key !== 'ArrowRight' && key !== 'ArrowLeft') || !visible || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.tagName === 'SELECT') return;
    event.preventDefault();
    step(key === 'ArrowRight' ? 1 : -1);
  });

  // Arrastre horizontal (táctil o mouse) sobre el escenario.
  let startX = 0;
  let startY = 0;
  let tracking = false;
  on(stage, 'pointerdown', event => {
    const e = event as PointerEvent;
    if ((e.target as HTMLElement).closest('.pj-controls,.pj-all,.pj-actions')) return;
    tracking = true; dragged = false; startX = e.clientX; startY = e.clientY;
  }, { passive: true });
  on(stage, 'pointerup', event => {
    if (!tracking) return;
    tracking = false;
    const e = event as PointerEvent;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      dragged = true;
      step(dx < 0 ? 1 : -1);
      window.setTimeout(() => { dragged = false; }, 320);
    }
  }, { passive: true });
  on(stage, 'pointercancel', () => { tracking = false; }, { passive: true });

  // Perspectiva hacia el puntero sobre la portada activa (sólo mazo, puntero fino y tier completo).
  if (mode === 'deck' && full && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const move = (event: Event) => {
      const { clientX, clientY } = event as PointerEvent;
      const cover = covers[index];
      if (!cover) return;
      const box = cover.getBoundingClientRect();
      const px = clamp((clientX - box.left) / box.width);
      const py = clamp((clientY - box.top) / box.height);
      gsap.to(cover, { rotationY: (px - .5) * 13, rotationX: -(py - .5) * 10, duration: .6, ease: 'power3.out', overwrite: 'auto' });
      cover.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      cover.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const leave = () => { const cover = covers[index]; if (cover) gsap.to(cover, { rotationX: 0, rotationY: 0, duration: .8, ease: 'power3.out', overwrite: 'auto' }); };
    on(stage, 'pointermove', move, { passive: true });
    on(stage, 'pointerleave', leave);
  }
  on(window, 'resize', () => { measure(); render(state.pos); }, { passive: true });

  return () => {
    listeners.forEach(off => off());
    watcher.disconnect();
    tween?.kill();
    intro.kill();
    gsap.set([...cards, ...infos, ...items], { clearProps: 'all' });
  };
}
