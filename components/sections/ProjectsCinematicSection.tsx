'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { projects, getProjectCoverPath, type Project } from '@/data/projects';
import { GlassFold } from '@/components/ui/glass-fold';

export interface ProjectsCinematicSectionProps {
  items?: readonly Project[];
  className?: string;
}

export function ProjectsCinematicSection({
  items = projects,
  className = '',
}: ProjectsCinematicSectionProps) {
  const [active, setActive] = React.useState(0);
  const [direction, setDirection] = React.useState(1); // 1 = forward, -1 = backward
  const count = items.length;

  const currentProject = items[active] ?? items[0] ?? projects[0];
  if (!currentProject) return null;

  const go = (index: number) => {
    const next = Math.max(0, Math.min(count - 1, index));
    if (next !== active) {
      setDirection(next > active ? 1 : -1);
      setActive(next);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        go(active + 1);
      } else if (e.key === 'ArrowLeft') {
        go(active - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, count]);

  // Drag / swipe detection on the main canvas
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
        go(active + 1);
      } else {
        go(active - 1);
      }
    }
    setDragStart(null);
  };

  const progressPercentage = ((active + 1) / count) * 100;

  return (
    <section
      id="proyectos"
      className={`cinematic-showcase-section ${className}`}
      data-scene="proyectos"
      data-theme="navy-deep"
      data-nav="dark"
      aria-label="Proyectos de Dos Orillas Estudio"
    >
      {/* Full-bleed GlassFold Animated Ambient Background (Same as Soluciones) */}
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

      {/* Section Header */}
      <div className="cinematic-header-wrap">
        <div>
          <div className="cinematic-eyebrow">
            <span className="cinematic-eyebrow-dot" />
            <span>03 // Portafolio Seleccionado</span>
          </div>
          <h2 className="cinematic-title">PROYECTOS.</h2>
          <p className="cinematic-subtitle">
            Soluciones digitales diseñadas desde el problema real, sin atajos tecnológicos.
          </p>
        </div>

        <div>
          <Link
            href="/projects"
            className="mono inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 bg-white/5 text-xs text-white uppercase tracking-wider hover:bg-[#38bdf8]/15 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] transition-all duration-200"
          >
            <span>Ver todos los proyectos ({String(count).padStart(2, '0')})</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {/* Arena: Left narrative directly on background + Right visual focus canvas */}
      <div className="cinematic-arena">
        {/* Left Narrative — Unboxed, Directly on dark background */}
        <div className="cinematic-narrative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="cinematic-project-index">
                <span>CASO {String(active + 1).padStart(2, '0')} // {String(count).padStart(2, '0')}</span>
                <span className="text-white/20">·</span>
                <span className="cinematic-project-category">{currentProject.categoryLabel}</span>
              </div>

              <h3 className="cinematic-project-name">{currentProject.title}</h3>

              <p className="cinematic-project-summary">{currentProject.description}</p>

              {currentProject.technologies && currentProject.technologies.length > 0 && (
                <div className="cinematic-tech-section">
                  <div className="cinematic-tech-label">Tecnologías & Herramientas</div>
                  <div className="cinematic-tech-pills">
                    {currentProject.technologies.map((tech) => (
                      <span key={tech} className="cinematic-tech-pill">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="cinematic-actions-group">
                <Link
                  href={`/projects/${currentProject.slug}`}
                  className="cinematic-cta-button"
                >
                  <span>Explorar caso de estudio</span>
                  <span className="cinematic-cta-arrow" aria-hidden="true">→</span>
                </Link>

                <Link
                  href="#contacto"
                  className="mono text-xs text-white/60 hover:text-[#38bdf8] uppercase tracking-wider transition-colors duration-200"
                >
                  <span>Consultar por este tipo de solución →</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Stage — Sharp rectangular canvas with central spotlight + thumbnails strip */}
        <div className="cinematic-stage-wrap">
          {/* Main Focus Canvas (16:10 sharp rectangle) */}
          <div
            className="cinematic-canvas-wrapper"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProject.slug}
                className="w-full h-full relative"
                initial={{ opacity: 0, scale: 0.96, x: direction * 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.02, x: -direction * 40 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={getProjectCoverPath(currentProject)}
                  alt={currentProject.title}
                  fill
                  sizes="(min-width: 1024px) 52vw, 92vw"
                  className="cinematic-main-image"
                  priority
                />

                {/* Badge on top-left of image */}
                <div className="cinematic-canvas-badge">
                  <span>{String(active + 1).padStart(2, '0')} // {currentProject.categoryLabel}</span>
                </div>

                {/* Hover affordance on bottom-right of image */}
                <Link
                  href={`/projects/${currentProject.slug}`}
                  className="cinematic-canvas-action"
                >
                  <span>VER CASO ↗</span>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Thumbnails Deck (5 sharp cards) */}
          <div className="cinematic-thumbs-row" role="tablist" aria-label="Seleccionar proyecto">
            {items.map((project, i) => {
              const isActive = i === active;
              return (
                <button
                  key={project.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-active={String(isActive)}
                  className="cinematic-thumb-card"
                  onClick={() => go(i)}
                  title={project.title}
                >
                  <Image
                    src={getProjectCoverPath(project)}
                    alt={project.title}
                    width={240}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                  <span className="cinematic-thumb-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Dock: Progress track & Arrow Navigation */}
      <div className="cinematic-dock-row">
        {/* Visual Progress Bar */}
        <div className="cinematic-progress-track">
          <div
            className="cinematic-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Counter and Navigation Arrows */}
        <div className="cinematic-controls-group">
          <span className="cinematic-counter-display">
            <span className="cinematic-counter-current">{String(active + 1).padStart(2, '0')}</span>
            {' / '}
            <span>{String(count).padStart(2, '0')}</span>
          </span>

          <button
            type="button"
            className="cinematic-btn-arrow"
            aria-label="Proyecto anterior"
            disabled={active <= 0}
            onClick={() => go(active - 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className="cinematic-btn-arrow"
            aria-label="Siguiente proyecto"
            disabled={active >= count - 1}
            onClick={() => go(active + 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProjectsCinematicSection;
