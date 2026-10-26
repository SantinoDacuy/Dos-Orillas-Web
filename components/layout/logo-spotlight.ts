/**
 * Luz interactiva dentro del logo (adaptada del paquete «dos-orillas-logo-spotlight», que relevó el pie de
 * optium.com.ar). El logo real es una máscara CSS; acá sólo se mueven dos variables con el puntero.
 * Devuelve la limpieza para el desmontaje de React y la navegación entre páginas.
 */
interface SpotlightOptions {
  /** Zona que escucha el puntero; por defecto, el footer más cercano. */
  zone?: HTMLElement;
  /** Barrido lento en dispositivos sin mouse fino. */
  autoSweep?: boolean;
  /** Movimiento reducido del sitio (además de la preferencia del sistema): luz estática. */
  reduced?: boolean;
}

const REST = { x: 50, y: 60 };

export function mountLogoSpotlight(root: HTMLElement, options: SpotlightOptions = {}): () => void {
  const zone = options.zone ?? root.closest<HTMLElement>('footer') ?? root;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const autoSweep = options.autoSweep !== false;
  const still = () => reduce.matches || options.reduced === true;
  let visible = false;
  let raf = 0;
  let last: number | null = null;
  let phase = 0;
  let pending: { x: number; y: number } | null = null;
  let disposed = false;

  const paint = (x: number, y: number) => {
    root.style.setProperty('--spot-x', `${x}%`);
    root.style.setProperty('--spot-y', `${y}%`);
  };

  const sweepAllowed = () => visible && document.visibilityState !== 'hidden' && !still() && !fine.matches && autoSweep;

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    if (pending) {
      paint(pending.x, pending.y);
      pending = null;
    }
    if (sweepAllowed()) {
      // Equivale a 0.006 rad por frame a 60 Hz, sin depender de la frecuencia de la pantalla.
      if (last !== null) phase += Math.min(now - last, 64) * 0.00036;
      last = now;
      paint(50 + Math.sin(phase) * 46, 58 + Math.cos(phase * 0.7) * 16);
      raf = requestAnimationFrame(frame);
    } else {
      last = null;
    }
  };

  const requestFrame = () => { if (!raf && !disposed) raf = requestAnimationFrame(frame); };

  // Mismo cálculo que la referencia: posición respecto del rectángulo del logo, acotada, sin inercia.
  const onMove = (event: PointerEvent) => {
    if (!fine.matches || still() || event.pointerType === 'touch') return;
    const bounds = root.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pending = {
      x: Math.max(-20, Math.min(120, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(-40, Math.min(140, (event.clientY - bounds.top) / bounds.height * 100)),
    };
    requestFrame();
  };

  const onLeave = () => {
    pending = null;
    paint(REST.x, REST.y);
  };

  const synchronize = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = null;
    pending = null;
    paint(REST.x, REST.y);
    if (sweepAllowed()) requestFrame();
  };

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    const entry = entries[0];
    visible = !!entry && entry.isIntersecting && entry.intersectionRatio >= 0.05;
    synchronize();
  }, { threshold: [0, 0.05] }) : null;

  zone.addEventListener('pointermove', onMove, { passive: true });
  zone.addEventListener('pointerleave', onLeave);
  fine.addEventListener('change', synchronize);
  reduce.addEventListener('change', synchronize);
  document.addEventListener('visibilitychange', synchronize);
  if (observer) observer.observe(root);
  else { visible = true; synchronize(); }

  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    observer?.disconnect();
    zone.removeEventListener('pointermove', onMove);
    zone.removeEventListener('pointerleave', onLeave);
    fine.removeEventListener('change', synchronize);
    reduce.removeEventListener('change', synchronize);
    document.removeEventListener('visibilitychange', synchronize);
    paint(REST.x, REST.y);
  };
}
