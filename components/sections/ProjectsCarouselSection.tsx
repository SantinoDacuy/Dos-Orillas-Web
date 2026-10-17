'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { projects, getProjectCoverPath, type Project } from '@/data/projects';
import { springEasing, clampIndex, stepOf } from '@/components/ui/staircase-carousel';

export interface ProjectsCarouselSectionProps {
  items?: readonly Project[];
  className?: string;
}

export function ProjectsCarouselSection({
  items = projects,
  className = '',
}: ProjectsCarouselSectionProps) {
  const n = items.length;
  const [active, setActive] = React.useState(0);
  const swipe = React.useRef({ id: -1, x: 0, done: false });

  // Spring easing for the carousel strip translation
  const strip = React.useMemo(() => springEasing(0.12, 0.75), []);

  const go = React.useCallback(
    (index: number) => {
      const next = clampIndex(index, n);
      if (next !== active) {
        setActive(next);
      }
    },
    [active, n]
  );

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(active - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(n - 1);
    }
  };

  // Pointer drag gestures
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { id: e.pointerId, x: e.clientX, done: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (s.id !== e.pointerId || s.done) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 35) {
      s.done = true;
      go(active + (dx < 0 ? 1 : -1));
    }
  };

  const onPointerEnd = () => {
    swipe.current.id = -1;
    window.setTimeout(() => {
      swipe.current.done = false;
    }, 0);
  };

  const currentProject = items[active] ?? items[0] ?? projects[0];
  if (!currentProject) return null;

  return (
    <section
      id="proyectos"
      className={`projects-section-container ${className}`}
      data-scene="proyectos"
      data-theme="navy-deep"
      data-nav="dark"
      aria-label="Proyectos de Dos Orillas Estudio"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Section Header */}
      <header className="projects-section-header">
        <div>
          <div className="projects-header-badge">
            <span>03 // Portafolio de Soluciones</span>
          </div>
          <h2 className="projects-header-title">PROYECTOS.</h2>
          <p className="projects-header-subtitle">
            Soluciones digitales diseñadas desde el problema real, sin atajos tecnológicos.
          </p>
        </div>
        <div className="projects-header-action">
          <Link href="/projects" className="projects-view-all-link">
            <span>Ver todos los proyectos ({String(n).padStart(2, '0')})</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      {/* Main Interactive Showcase (Staircase + Detail Panel) */}
      <div className="projects-showcase-stage">
        {/* Left Column: Staircase Carousel */}
        <div
          className="showcase-carousel-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="showcase-carousel-track-wrapper">
            <div
              className="showcase-carousel-track"
              style={{
                transform: `translateX(calc(${-active} * var(--slide-w, 280px)))`,
                transition: `transform ${strip.ms}ms ${strip.easing}`,
              }}
            >
              {items.map((project, i) => {
                const isActive = i === active;
                const step = stepOf(i, active);
                const transform = `translateY(${step * 22}%) scale(${isActive ? 1 : 0.8})`;

                return (
                  <button
                    key={project.slug}
                    type="button"
                    className="showcase-slide-item"
                    data-active={String(isActive)}
                    aria-label={`Proyecto ${i + 1} de ${n}: ${project.title}`}
                    aria-current={isActive ? 'true' : undefined}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => {
                      if (swipe.current.done) return;
                      go(i);
                    }}
                    style={{
                      transform,
                      transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease, filter 500ms ease',
                    }}
                  >
                    <span className="showcase-slide-badge">
                      {String(i + 1).padStart(2, '0')} // {String(n).padStart(2, '0')}
                    </span>
                    <Image
                      src={getProjectCoverPath(project)}
                      alt={project.title}
                      width={600}
                      height={800}
                      priority={i < 2}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Project Details Panel with Motion */}
        <div className="showcase-detail-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject.slug}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Meta row */}
              <div className="detail-meta-row">
                <span className="detail-index">
                  CASO {String(active + 1).padStart(2, '0')} DE {String(n).padStart(2, '0')}
                </span>
                <span className="detail-separator" aria-hidden="true">·</span>
                <span className="detail-category">{currentProject.categoryLabel}</span>
              </div>

              {/* Title */}
              <h3 className="detail-title">{currentProject.title}</h3>

              {/* Description */}
              <p className="detail-desc">{currentProject.description}</p>

              {/* Technologies */}
              {currentProject.technologies.length > 0 && (
                <div>
                  <div className="detail-tags-title">Tecnologías & Herramientas</div>
                  <div className="detail-tech-tags">
                    {currentProject.technologies.map((tech) => (
                      <span key={tech} className="detail-tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="detail-actions-row">
                <Link
                  href={`/projects/${currentProject.slug}`}
                  className="detail-primary-cta"
                >
                  <span>Explorar caso de estudio</span>
                  <span className="detail-cta-arrow" aria-hidden="true">→</span>
                </Link>

                <Link
                  href="#contacto"
                  className="projects-view-all-link"
                  style={{ fontSize: '0.75rem', padding: '10px 16px' }}
                >
                  <span>Consultar por este tipo de solución</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation Controls Bar */}
      <footer className="showcase-navigation-bar">
        <div className="showcase-drag-hint">
          <span>← Arrastrá o usá las flechas del teclado para explorar →</span>
        </div>

        <div className="showcase-controls-pill">
          {/* Previous Button */}
          <button
            type="button"
            className="showcase-nav-btn"
            aria-label="Proyecto anterior"
            disabled={active <= 0}
            onClick={() => go(active - 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="showcase-dots-track">
            {items.map((project, i) => (
              <button
                key={project.slug}
                type="button"
                className="showcase-dot-item"
                data-active={String(i === active)}
                aria-label={`Ir al proyecto ${i + 1}: ${project.title}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            className="showcase-nav-btn"
            aria-label="Siguiente proyecto"
            disabled={active >= n - 1}
            onClick={() => go(active + 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Counter */}
          <span className="showcase-counter">
            {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </span>
        </div>
      </footer>
    </section>
  );
}
