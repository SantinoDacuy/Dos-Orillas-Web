import type { gsap as GSAP } from 'gsap';

interface CrossingTargets {
  track: HTMLElement;
  gap: HTMLElement;
  particle: HTMLElement;
  stage: HTMLElement;
}

const smooth = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** «Nosotros»: una sola partícula que espera en la primera orilla, cruza el hueco por el centro de la
 * pantalla mientras la pista avanza y se apaga al tocar la otra orilla. Sin estela ni trazos.
 * Lee la posición de la pista que escribe el timeline (nunca el layout dentro del frame). */
export function createCrossing(gsap: typeof GSAP, { track, gap, particle, stage }: CrossingTargets) {
  let width = 0;
  let gapStart = 0;
  let gapEnd = 0;
  let active = false;
  const setX = gsap.quickSetter(particle, 'x', 'px');
  const setOpacity = gsap.quickSetter(particle, 'opacity');

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
    // Antes de partir espera en la primera orilla; al llegar a la otra se apaga.
    const presence = crossing < .5 ? 1 : 1 - smooth(.9, 1, crossing);
    setX(trackX + gapStart + crossing * span);
    setOpacity(presence);
  };
  gsap.ticker.add(tick);

  return {
    remeasure: measure,
    setActive: (next: boolean) => { active = next; },
    dispose: () => {
      gsap.ticker.remove(tick);
      gsap.set(particle, { clearProps: 'x,opacity' });
    },
  };
}
