'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { manifestoCopy } from '@/content/site';
import { FilmstripTrack, type HeroCarouselItem, CAROUSEL_GRAIN } from '@/components/ui/hero-carousel';

const CAROUSEL_ITEMS: HeroCarouselItem[] = [
  {
    id: 'fondo-1',
    title: 'Túnel // Monograma Dos Orillas',
    image: '/fondos/fondo-1.png',
    meta: ['ATMÓSFERA', '01'],
    accent: '#0d2847',
  },
  {
    id: 'fondo-2',
    title: 'Ola Azul // Firma Dos Orillas',
    image: '/fondos/fondo-2.png',
    meta: ['RÍO', '02'],
    accent: '#092543',
  },
  {
    id: 'fondo-3',
    title: 'Espresso & DOS // Detalle',
    image: '/fondos/fondo-3.png',
    meta: ['ESTUDIO', '03'],
    accent: '#0e2b4b',
  },
  {
    id: 'fondo-4',
    title: 'Portátil & Hélice // Luz Azul',
    image: '/fondos/fondo-4.png',
    meta: ['CREACIÓN', '04'],
    accent: '#10263e',
  },
  {
    id: 'fondo-5',
    title: 'Planeta Azul // Sonda Estelar',
    image: '/fondos/fondo-5.png',
    meta: ['VISIÓN', '05'],
    accent: '#0a1d33',
  },
  {
    id: 'fondo-6',
    title: 'Esquiador Veloz // Nieve Azul',
    image: '/fondos/fondo-6.png',
    meta: ['VELOCIDAD', '06'],
    accent: '#0f3152',
  },
  {
    id: 'fondo-7',
    title: 'Retrato // Broche Dos Orillas',
    image: '/fondos/fondo-7.png',
    meta: ['IDENTIDAD', '07'],
    accent: '#0c223a',
  },
  {
    id: 'fondo-8',
    title: 'Río Entre Bosques // Azul Profundo',
    image: '/fondos/fondo-8.png',
    meta: ['ORILLAS', '08'],
    accent: '#071725',
  },
];

export function Manifesto() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = CAROUSEL_ITEMS[activeIndex] || CAROUSEL_ITEMS[0] || {
    id: 'fondo-1',
    title: 'Túnel // Monograma Dos Orillas',
    image: '/fondos/fondo-1.png',
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
            {/* Balanced atmosphere: preserves the photo's natural clarity with a balanced dark mood */}
            <div className="absolute inset-0 bg-[#071725]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071725]/80 via-transparent to-[#071725]/70" />
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
