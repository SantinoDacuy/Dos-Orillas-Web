'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { manifestoCopy } from '@/content/site';
import { FilmstripTrack, type HeroCarouselItem, CAROUSEL_GRAIN } from '@/components/ui/hero-carousel';

// Initial showcase slides — the user will provide the final custom images.
const CAROUSEL_ITEMS: HeroCarouselItem[] = [
  {
    id: 'river-delta',
    title: 'Delta del Río Uruguay',
    image: '/images/river-delta.jpg',
    meta: ['NATURALEZA', 'ENTRE RÍOS'],
    accent: '#0d2847',
  },
  {
    id: 'mate-unico',
    title: 'Mate Único // E-Commerce',
    image: '/projects/mate-unico/cover.webp',
    meta: ['WEB', 'PLATAFORMA'],
    accent: '#10263e',
  },
  {
    id: 'clasificador',
    title: 'Clasificador de Frutas // Visión IA',
    image: '/projects/clasificador-de-frutas/cover.webp',
    meta: ['IA', 'AUTOMATIZACIÓN'],
    accent: '#0a324d',
  },
  {
    id: 'aeropuerto',
    title: 'Gestión Aeroportuaria // Plataforma',
    image: '/projects/gestion-aeroportuaria/cover.webp',
    meta: ['SISTEMAS', 'TIEMPO REAL'],
    accent: '#162b48',
  },
  {
    id: 'transacciones',
    title: 'Transacciones en Tiempo Real // Core',
    image: '/projects/transacciones-en-tiempo-real/cover.webp',
    meta: ['FINTECH', 'DATA'],
    accent: '#0b1e36',
  },
];

export function Manifesto() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = CAROUSEL_ITEMS[activeIndex] || CAROUSEL_ITEMS[0] || {
    id: 'river-delta',
    title: 'Delta del Río Uruguay',
    image: '/images/river-delta.jpg',
    accent: '#0d2847',
  };

  return (
    <section 
      id="manifiesto" 
      className="manifesto-section" 
      data-theme="navy-deep" 
      data-scene="manifesto" 
      aria-labelledby="manifesto-title"
    >
      {/* ── Dynamic Full-Bleed Background for the ENTIRE Section ── */}
      <div className="manifesto-full-backdrop" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={activeIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.img
              src={activeItem.image}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1.04 }}
              transition={{ duration: 8, ease: "linear" }}
            />
            {/* Color grade overlays to match active slide's hue */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: activeItem.accent ?? '#071725', mixBlendMode: 'color' }}
            />
            <div
              className="absolute inset-0 opacity-65"
              style={{ backgroundColor: activeItem.accent ?? '#071725', mixBlendMode: 'multiply' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Global section vignette, film grain, and seamless edge blends */}
        <div className="manifesto-backdrop-vignette" />
        <div 
          className="manifesto-backdrop-grain" 
          style={{ backgroundImage: CAROUSEL_GRAIN, backgroundSize: '180px 180px' }}
        />
        <div className="manifesto-bg-mask-top" />
        <div className="manifesto-bg-mask-bottom" />
      </div>

      <div className="manifesto-container">
        <h2 id="manifesto-title" className="sr-only">{manifestoCopy.title}</h2>

        {/* Telemetry pill */}
        <div className="manifesto-telemetry" aria-hidden="true">
          <span className="manifesto-telemetry-badge">
            <span className="manifesto-telemetry-dot" />
            02 // MANIFIESTO
          </span>
          <span className="manifesto-telemetry-coords">
            CONCEPCIÓN DEL URUGUAY &middot; ENTRE RÍOS
          </span>
        </div>

        {/* Stage 1: Premise */}
        <div className="manifesto-premise">
          <div className="manifesto-first-stage">
            <p className="manifesto-statement manifesto-first" data-manifesto-lines>
              {manifestoCopy.firstLines.map((line, index) => (
                <span className="manifesto-line-mask" key={line}>
                  <span className="manifesto-line-inner">
                    {index === 2 ? (
                      <span className="manifesto-struck">
                        {line}
                        <span 
                          className="manifesto-bridge" 
                          data-manifesto-bridge 
                          data-bridge="horizontal" 
                          aria-hidden="true" 
                        />
                      </span>
                    ) : (
                      line
                    )}
                  </span>
                  {index < manifestoCopy.firstLines.length - 1 ? ' ' : null}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Carousel Filmstrip sitting between both statements (Moves manually, no wheel hijacking) */}
        <div className="manifesto-filmstrip-row">
          <FilmstripTrack 
            items={CAROUSEL_ITEMS}
            index={activeIndex}
            onChange={setActiveIndex}
            cardHeight={260}
          />
        </div>

        {/* Stage 2: Resolution */}
        <div className="manifesto-resolution">
          <p className="manifesto-statement manifesto-second" data-manifesto-lines>
            {manifestoCopy.secondLines.map((line, index) => (
              <span className="manifesto-line-mask" key={line}>
                <span className={`manifesto-line-inner${index === 2 ? ' manifesto-emphasis' : ''}`}>
                  {line}
                </span>
                {index < manifestoCopy.secondLines.length - 1 ? ' ' : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
