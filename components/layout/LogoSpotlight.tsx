'use client';

import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { mountLogoSpotlight } from './logo-spotlight';

type Props = {
  /** SVG con trazados o PNG/WebP con transparencia real, servido desde /public. */
  src: string;
  alt?: string;
  /** Ancho / alto del archivo original: el logo no se estira ni se recorta. */
  aspectRatio: number;
  /** Color de la luz en RGB; por defecto, el acento del sitio (#68B1FF). */
  colorRgb?: string;
  autoSweep?: boolean;
  /** Zona de seguimiento; por defecto, el footer más cercano. */
  zoneRef?: RefObject<HTMLElement | null>;
  className?: string;
};

/** El logo real como máscara de un degradado radial que sigue al puntero (sin rerender por movimiento). */
export function LogoSpotlight({ src, alt = '', aspectRatio, colorRgb = '104, 177, 255', autoSweep = true, zoneRef, className = '' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  useEffect(() => {
    if (!rootRef.current) return;
    return mountLogoSpotlight(rootRef.current, { zone: zoneRef?.current ?? undefined, autoSweep, reduced });
  }, [zoneRef, autoSweep, reduced, src]);

  const style = {
    '--logo-mask': `url(${JSON.stringify(src)})`,
    '--logo-ratio': String(aspectRatio),
    '--spot-rgb': colorRgb,
  } as CSSProperties;

  return <div
    ref={rootRef}
    className={`logo-spotlight ${className}`}
    style={style}
    role={alt ? 'img' : undefined}
    aria-label={alt || undefined}
    aria-hidden={alt ? undefined : true}
  >
    <div className="logo-spotlight__art" aria-hidden="true">
      <span className="logo-spotlight__paint" />
    </div>
    {/* Sólo se ve si el navegador no admite máscaras CSS. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="logo-spotlight__fallback" src={src} alt="" aria-hidden="true" decoding="async" />
  </div>;
}
