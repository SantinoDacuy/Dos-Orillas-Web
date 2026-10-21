import type { gsap as GSAP } from 'gsap';

interface RiverTargets {
  stage: HTMLElement;
  track: HTMLElement;
  gap: HTMLElement;
  canvas: HTMLCanvasElement;
}

const LINES = 17;
const smooth = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Canvas 2D water lines that live only inside the gap between the two shores.
 * Waves are anchored to track coordinates, so scrolling pans the river; scroll velocity
 * only speeds up the current. It draws while the scene is visible and never reads layout in a frame. */
export function createRiver(gsap: typeof GSAP, { stage, track, gap, canvas }: RiverTargets) {
  const context = canvas.getContext('2d');
  if (!context) return { pulse: () => {}, remeasure: () => {}, setActive: () => {}, dispose: () => {} };
  const paint = context;
  let width = 0;
  let height = 0;
  let gapStart = 0;
  let gapEnd = 0;
  let active = false;
  let flow = 0;
  let velocity = 0;
  let pulse = 0;

  const measure = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = stage.clientWidth;
    height = stage.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    paint.setTransform(dpr, 0, 0, dpr, 0, 0);
    gapStart = gap.offsetLeft;
    gapEnd = gap.offsetLeft + gap.offsetWidth;
  };
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  measure();

  const lines = Array.from({ length: LINES }, (_, index) => {
    const o = (index / (LINES - 1) - .5) * 2;
    return {
      o,
      weight: 1 - Math.abs(o),
      phase: index * 1.73,
      k1: .0046 + (index % 5) * .00045,
      k2: .0112 + (index % 3) * .0011,
      speed: .55 + (index % 4) * .16,
    };
  });

  const tick = (_time: number, delta: number) => {
    if (!active) return;
    const dt = Math.min(delta, 64) / 1000;
    velocity += (pulse - velocity) * Math.min(1, dt * 6);
    pulse *= Math.pow(.02, dt);
    flow += dt * (.5 + Math.min(Math.abs(velocity) / 700, 3.2));

    const trackX = Number(gsap.getProperty(track, 'x')) || 0;
    const trackY = Number(gsap.getProperty(track, 'y')) || 0;
    const scale = Number(gsap.getProperty(track, 'scaleX')) || 1;
    const left = trackX + scale * gapStart;
    const right = trackX + scale * gapEnd;
    paint.clearRect(0, 0, width, height);
    if (right < 0 || left > width) return;

    const from = Math.max(0, left);
    const to = Math.min(width, right);
    const fade = Math.max(40, 150 * scale);
    const cy = height * .5 + trackY;
    const spread = height * .26 * Math.pow(scale, .7);
    const amplitude = Math.pow(scale, .6);

    const gradient = paint.createLinearGradient(left, 0, right, 0);
    const edge = Math.min(.45, fade / Math.max(1, right - left));
    gradient.addColorStop(0, 'rgba(127,166,207,0)');
    gradient.addColorStop(edge, 'rgba(160,190,222,1)');
    gradient.addColorStop(1 - edge, 'rgba(160,190,222,1)');
    gradient.addColorStop(1, 'rgba(127,166,207,0)');
    paint.lineWidth = 1;
    paint.lineCap = 'round';
    paint.lineJoin = 'round';
    paint.globalCompositeOperation = 'lighter';
    paint.strokeStyle = gradient;

    for (const line of lines) {
      paint.globalAlpha = .06 + .3 * Math.pow(line.weight, 1.6);
      paint.beginPath();
      const baseY = cy + line.o * spread;
      for (let px = from; px <= to + 5; px += 6) {
        const u = (px - trackX) / scale;
        const envelope = smooth(left, left + fade, px) * (1 - smooth(right - fade, right, px));
        const wave = Math.sin(u * line.k1 + flow * line.speed + line.phase) * 22 +
          Math.sin(u * line.k2 - flow * line.speed * 1.7 + line.phase * 2.1) * 8 * (.4 + line.weight);
        const y = baseY + wave * amplitude * (.35 + .65 * envelope);
        if (px === from) paint.moveTo(px, y); else paint.lineTo(px, y);
      }
      paint.stroke();
    }
    paint.globalAlpha = 1;
    paint.globalCompositeOperation = 'source-over';
  };
  gsap.ticker.add(tick);

  return {
    /** Latest scroll velocity in px/s. */
    remeasure: measure,
    pulse: (value: number) => { pulse = value; },
    setActive: (next: boolean) => {
      active = next;
      if (!next) paint.clearRect(0, 0, width, height);
    },
    dispose: () => {
      gsap.ticker.remove(tick);
      resize.disconnect();
      paint.clearRect(0, 0, width, height);
      canvas.width = canvas.height = 0;
    },
  };
}
