'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassFold } from '@/components/ui/glass-fold';

export interface ShowcaseProject {
  id: string;
  categoria: string;
  titulo: string;
  problema?: string;
  solucion?: string;
  descripcion: string;
  stack: string[];
  stackCompleto: string[];
  imagen: string;
  alt: string;
  href: string;
  nombreCorto: string;
  contactQuery: string;
}

// 5 curated flagship projects for Dos Orillas Estudio
export const SHOWCASE_PROJECTS: readonly ShowcaseProject[] = [
  {
    id: 'mate-unico',
    categoria: 'E-COMMERCE / SISTEMAS',
    titulo: 'Mate Único',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Tienda digital especializada con checkout integrado, catálogo dinámico y panel de administración en tiempo real.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Mercado Pago', 'Tailwind'],
    stackCompleto: ['React (Router)', 'Node.js/Express', 'PostgreSQL', 'Strapi', 'API de Mercado Pago', 'Google OAuth'],
    imagen: '/projects/mate-unico/cover.webp',
    alt: 'Plataforma e-commerce Mate Único',
    href: '/projects/mate-unico',
    nombreCorto: 'Mate Único',
    contactQuery: 'ecommerce',
  },
  {
    id: 'gestion-aeroportuaria',
    categoria: 'BACKEND / DATOS / GEOLOCALIZACIÓN',
    titulo: 'Gestión Aeroportuaria',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Plataforma geoespacial para monitoreo de tráfico aéreo e infraestructura con visualización interactiva y APIs.',
    stack: ['API REST', 'MongoDB', 'Redis', 'Leaflet', 'Docker'],
    stackCompleto: ['API REST', 'MongoDB', 'Redis', 'Leaflet', 'Docker', 'Docker Compose'],
    imagen: '/projects/gestion-aeroportuaria/cover.webp',
    alt: 'Sistema de Gestión Aeroportuaria con mapas interactivos',
    href: '/projects/gestion-aeroportuaria',
    nombreCorto: 'Aeropuertos',
    contactQuery: 'sistemas',
  },
  {
    id: 'clasificador-de-frutas',
    categoria: 'INTELIGENCIA ARTIFICIAL',
    titulo: 'Clasificador de Frutas',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Red neuronal ART1 aplicada a la clasificación automática y control de calidad visual en procesos industriales.',
    stack: ['Python', 'Redes Neuronales', 'ART1', 'Computer Vision'],
    stackCompleto: ['Python', 'ART1 (Carpenter-Grossberg)', 'Redes Neuronales', 'Computer Vision'],
    imagen: '/projects/clasificador-de-frutas/cover.webp',
    alt: 'Clasificador de frutas con algoritmo neuronal ART1',
    href: '/projects/clasificador-de-frutas',
    nombreCorto: 'Clasificador IA',
    contactQuery: 'ia',
  },
  {
    id: 'retail-vision',
    categoria: 'DATOS / BUSINESS INTELLIGENCE',
    titulo: 'Retail Vision',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Arquitectura de Data Warehouse y dashboards analíticos para la toma de decisiones comerciales estratégicas.',
    stack: ['PostgreSQL', 'Tableau', 'Data Warehouse', 'ETL Pipeline', 'SQL'],
    stackCompleto: ['PostgreSQL', 'Tableau', 'Data Warehouse', 'ETL Pipeline', 'SQL'],
    imagen: '/projects/retail-vision/cover.webp',
    alt: 'Dashboard de métricas comerciales Retail Vision',
    href: '/projects/retail-vision',
    nombreCorto: 'Retail Vision',
    contactQuery: 'datos',
  },
  {
    id: 'transacciones-en-tiempo-real',
    categoria: 'ARQUITECTURA / SISTEMAS DISTRIBUIDOS',
    titulo: 'Transacciones en Tiempo Real',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Arquitectura orientada a eventos con Kafka y SSE para procesamiento transaccional resiliente y timeline en vivo.',
    stack: ['Next.js', 'Apache Kafka', 'Event-Driven', 'SSE', 'Node.js'],
    stackCompleto: ['Next.js', 'KafkaJS', 'Apache Kafka', 'Server-Sent Events', 'Event-Driven Architecture'],
    imagen: '/projects/transacciones-en-tiempo-real/cover.webp',
    alt: 'Arquitectura de eventos y transacciones en tiempo real',
    href: '/projects/transacciones-en-tiempo-real',
    nombreCorto: 'Tiempo Real',
    contactQuery: 'arquitectura',
  },
];

export interface ProjectsCinematicSectionProps {
  items?: readonly ShowcaseProject[];
  className?: string;
}

export function ProjectsCinematicSection({
  items = SHOWCASE_PROJECTS,
  className = '',
}: ProjectsCinematicSectionProps) {
  const [active, setActive] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const count = items.length;

  if (count === 0) return null;

  const currentProject = items[active] ?? items[0];
  if (!currentProject) return null;

  const go = React.useCallback((index: number) => {
    const next = Math.max(0, Math.min(count - 1, index));
    if (next !== active) {
      setAnimating(true);
      setActive(next);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [active, count]);

  const goNext = React.useCallback(() => {
    go(active < count - 1 ? active + 1 : 0);
  }, [active, count, go]);

  const goPrev = React.useCallback(() => {
    go(active > 0 ? active - 1 : count - 1);
  }, [active, count, go]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Touch / mouse swipe detection
  const [dragStart, setDragStart] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    setDragStart(clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    const clientX = 'changedTouches' in e ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX;
    const diff = clientX - dragStart;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setDragStart(null);
  };

  // Preload next and previous images
  React.useEffect(() => {
    if (count === 0) return;
    const nextItem = items[(active + 1) % count];
    const prevItem = items[(active - 1 + count) % count];
    if (nextItem) {
      const nextImg = new window.Image();
      nextImg.src = nextItem.imagen;
    }
    if (prevItem) {
      const prevImg = new window.Image();
      prevImg.src = prevItem.imagen;
    }
  }, [active, count, items]);

  const prevProject = items[(active - 1 + count) % count] ?? currentProject;
  const nextProject = items[(active + 1) % count] ?? currentProject;

  return (
    <section
      id="proyectos"
      className={`cinematic-showcase-section ${className}`}
      data-scene="proyectos"
      data-theme="navy-deep"
      data-nav="dark"
      role="region"
      aria-roledescription="carousel"
      aria-label="Proyectos seleccionados de Dos Orillas Estudio"
    >
      {/* Live region for accessibility screen readers */}
      <div className="sr-only" aria-live="polite">
        Proyecto {active + 1} de {count}: {currentProject.titulo}. {currentProject.categoria}.
      </div>

      {/* Full-bleed Ambient Background */}
      <div className="projects-glassfold-backdrop" aria-hidden="true">
        <GlassFold
          color1="#0c2d4a"
          color2="#06121d"
          color3="#2575a2"
          speed={0.3}
          scale={1.0}
          noise={0.04}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
        <div className="projects-backdrop-vignette" />
        <div className="projects-bg-mask-top" />
        <div className="projects-bg-mask-bottom" />
      </div>

      <div className="cinematic-container">
        {/* Streamlined Section Header: Title & Subtitle left, View All right */}
        <div className="cinematic-header-wrap">
          <div className="cinematic-header-left">
            <div className="cinematic-eyebrow">
              <span className="cinematic-eyebrow-dot" />
              <span>03 // Portafolio Seleccionado</span>
            </div>
            <div className="cinematic-title-row">
              <h2 className="cinematic-title">PROYECTOS.</h2>
              <p className="cinematic-subtitle">
                Soluciones digitales diseñadas desde el problema real, sin atajos tecnológicos.
              </p>
            </div>
          </div>

          <div className="cinematic-header-right">
            <Link
              href="/projects"
              className="cinematic-view-all-btn"
              title="Ver el catálogo completo de proyectos"
            >
              <span>VER TODOS LOS PROYECTOS ({String(count).padStart(2, '0')})</span>
              <span className="cinematic-view-all-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Showcase Arena */}
        <div className="cinematic-arena">
          {/* Left Column: Narrative (Strictly top-to-bottom hierarchy) */}
          <div className="cinematic-narrative" style={{ minHeight: '260px' }}>
            <div className={`cinematic-narrative-content ${animating ? 'cinematic-fade-out' : 'cinematic-fade-in'}`}>
              {/* 1. Category in small mono (No duplicate 'CASO 01 // 05') */}
              <div className="cinematic-project-category">
                {currentProject.categoria}
              </div>

              {/* 2. Project Title */}
              <h3 className="cinematic-project-name">
                {currentProject.titulo}
              </h3>

              {/* 3. Short description (≤ 140 chars, max 2 lines, ~52ch) */}
              <p className="cinematic-project-summary">
                {currentProject.descripcion}
              </p>

              {/* 4. Tech stack pills (Max 5, subtle, no internal tools like Figma/UML) */}
              <div className="cinematic-tech-pills">
                {currentProject.stack.map((tech) => (
                  <span key={tech} className="cinematic-tech-pill">
                    {tech}
                  </span>
                ))}
              </div>

              {/* 5. Actions in a single horizontal row */}
              <div className="cinematic-actions-row">
                <Link
                  href={currentProject.href}
                  className="cinematic-primary-btn"
                >
                  <span>VER CASO DE ESTUDIO</span>
                  <span className="cinematic-btn-arrow" aria-hidden="true">→</span>
                </Link>

                <Link
                  href={`/#contacto?tipo=${currentProject.contactQuery}`}
                  className="cinematic-secondary-link"
                >
                  <span>QUIERO ALGO ASÍ</span>
                  <span className="cinematic-btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Focus (16:10 Canvas + Navigation + Thumbnails) */}
          <div className="cinematic-stage-wrap">
            {/* Main Image Canvas with integrated corner navigation */}
            <div
              className="cinematic-canvas-wrapper"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
            >
              <div className={`cinematic-canvas-image-layer ${animating ? 'cinematic-image-out' : 'cinematic-image-in'}`}>
                <Image
                  src={currentProject.imagen}
                  alt={currentProject.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 92vw"
                  className="cinematic-main-image"
                  priority
                />
              </div>

              {/* Persistent Navigation Controls on Bottom-Right Corner */}
              <div className="cinematic-corner-controls" aria-label="Controles de navegación">
                <button
                  type="button"
                  className="cinematic-corner-btn"
                  onClick={goPrev}
                  aria-label={`Proyecto anterior: ${prevProject.nombreCorto}`}
                  title="Anterior (←)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <div className="cinematic-corner-counter" aria-hidden="true">
                  <span>{String(active + 1).padStart(2, '0')}</span>
                  <span className="text-white/30">/</span>
                  <span className="text-white/60">{String(count).padStart(2, '0')}</span>
                </div>

                <button
                  type="button"
                  className="cinematic-corner-btn"
                  onClick={goNext}
                  aria-label={`Siguiente proyecto: ${nextProject.nombreCorto}`}
                  title="Siguiente (→)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 5 Thumbnails Strip (Immediately under the image, visible in 1080p) */}
            <div
              className="cinematic-thumbs-row"
              role="tablist"
              aria-label="Seleccionar proyecto"
            >
              {items.map((project, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={project.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-active={String(isActive)}
                    className="cinematic-thumb-card"
                    onClick={() => go(i)}
                    title={`Caso ${i + 1}: ${project.nombreCorto}`}
                  >
                    <Image
                      src={project.imagen}
                      alt={project.nombreCorto}
                      width={180}
                      height={112}
                      className="cinematic-thumb-img"
                    />
                    <div className="cinematic-thumb-label">
                      <span className="cinematic-thumb-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="cinematic-thumb-name">{project.nombreCorto}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectsCinematicSection;
