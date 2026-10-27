import type { CSSProperties } from 'react';

/** Estrellas en posiciones fijas (generador con semilla): el servidor y el navegador pintan lo mismo. */
const STARS = (() => {
  let seed = 7;
  const next = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return Array.from({ length: 56 }, () => ({
    left: `${(next() * 100).toFixed(2)}%`, top: `${(next() * 100).toFixed(2)}%`,
    peak: (.25 + next() * .55).toFixed(2), duration: `${(2 + next() * 3).toFixed(2)}s`, delay: `${(next() * 5).toFixed(2)}s`,
  }));
})();

/** Fondo único y fijo detrás de toda la home: una aurora en la paleta del sitio (adaptación en CSS de «Aurora
 * Background» de 21st.dev, sin framer-motion): azul noche de base, dos resplandores que pulsan, tres manchas de luz
 * azul y celeste que derivan muy lento, estrellas que titilan, grano y viñeta. Sólo transform y opacity; tier 0 y
 * movimiento reducido lo dejan quieto. */
export function LivingBackground() {
  return <div className="lb" aria-hidden="true">
    <span className="lb-pulse" />
    <span className="lb-aurora">
      <i className="lb-blob lb-blob-a" />
      <i className="lb-blob lb-blob-b" />
      <i className="lb-blob lb-blob-c" />
    </span>
    <span className="lb-stars">
      {STARS.map((star, index) => <i key={index} style={{
        left: star.left, top: star.top, '--peak': star.peak, '--d': star.duration, '--delay': star.delay,
      } as CSSProperties} />)}
    </span>
    <span className="lb-grain" />
    <span className="lb-vignette" />
  </div>;
}
