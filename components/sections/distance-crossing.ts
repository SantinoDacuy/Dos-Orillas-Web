import type { gsap as GSAP } from 'gsap';

interface CrossingTargets {
  track: HTMLElement;
  gap: HTMLElement;
  particle: HTMLElement;
  thread: HTMLElement | null;
  anchor: HTMLElement | null;
  stage: HTMLElement;
}

/** «Nosotros» forma la conexión: el punto espera en la orilla de «TU NEGOCIO», cruza el hueco por el centro de la
 * pantalla mientras la pista avanza y va dejando detrás una línea de luz que nace en esa orilla. Al tocar la otra,
 * la línea se enciende entera y el punto queda prendido en «LA TECNOLOGÍA» (data-linked en el escenario).
 * Lee la posición de la pista que escribe el timeline (nunca el layout dentro del frame) y sólo escribe transforms. */
export function createCrossing(gsap: typeof GSAP, { track, gap, particle, thread, anchor, stage }: CrossingTargets) {
  let width = 0;
  let gapStart = 0;
  let gapEnd = 0;
  let active = false;
  let linked = false;
  const setX = gsap.quickSetter(particle, 'x', 'px');
  const setThreadX = thread ? gsap.quickSetter(thread, 'x', 'px') : null;
  const setThreadScale = thread ? gsap.quickSetter(thread, 'scaleX') : null;
  const setAnchorX = anchor ? gsap.quickSetter(anchor, 'x', 'px') : null;

  const measure = () => {
    width = stage.clientWidth;
    gapStart = gap.offsetLeft;
    gapEnd = gap.offsetLeft + gap.offsetWidth;
  };
  measure();

  const tick = () => {
    if (!active) return;
    const trackX = Number(gsap.getProperty(track, 'x')) || 0;
    const span = Math.max(1, gapEnd - gapStart);
    const crossing = Math.min(1, Math.max(0, (width / 2 - trackX - gapStart) / span));
    const start = trackX + gapStart;
    setX(start + crossing * span);
    setAnchorX?.(start);
    // La línea mide lo que el punto ya recorrió; el elemento ocupa el ancho del escenario y se escala desde la izquierda.
    setThreadX?.(start);
    setThreadScale?.(crossing * span / Math.max(1, width));
    const next = crossing > .985;
    if (next !== linked) {
      linked = next;
      if (linked) stage.dataset.linked = 'true'; else delete stage.dataset.linked;
    }
  };
  gsap.ticker.add(tick);

  return {
    remeasure: measure,
    setActive: (next: boolean) => { active = next; },
    dispose: () => {
      gsap.ticker.remove(tick);
      gsap.set([particle, thread, anchor].filter((node): node is HTMLElement => !!node), { clearProps: 'x,scaleX,transform' });
      delete stage.dataset.linked;
    },
  };
}
