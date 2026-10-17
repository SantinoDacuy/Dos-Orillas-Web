'use client';

import * as React from 'react';
import Link from 'next/link';
import { projects, getProjectCoverPath } from '@/data/projects';
import { WorksWheel, type WorksWheelItem } from '@/components/ui/works-wheel';

export function ProjectsWheelSection() {
  const wheelItems: WorksWheelItem[] = React.useMemo(() => {
    return projects.map((p) => ({
      title: p.title,
      image: getProjectCoverPath(p),
      href: `/projects/${p.slug}`,
      category: p.categoryLabel,
      description: p.description,
      technologies: p.technologies,
    }));
  }, []);

  return (
    <section
      id="proyectos"
      className="projects-wheel-section relative w-full bg-[#071725] text-[#F2EEE6] pt-16 pb-12 overflow-hidden border-t border-white/5"
      data-scene="proyectos"
      data-theme="navy-deep"
      data-nav="dark"
      aria-label="Proyectos seleccionados"
    >
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[#38bdf8]/10 blur-[120px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-[#10263E]/40 blur-[140px]" 
        aria-hidden="true" 
      />

      {/* Header with Title and Eyebrow */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="mono text-xs text-[#38bdf8] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            <span>03 // Portafolio de Soluciones</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#F2EEE6] leading-none">
            PROYECTOS.
          </h2>
          <p className="text-white/60 text-sm sm:text-base mt-2 max-w-[46ch]">
            Soluciones digitales diseñadas desde el problema real, sin atajos tecnológicos.
          </p>
        </div>

        <div className="pt-2 md:pt-0">
          <Link
            href="/projects"
            className="mono inline-flex items-center gap-2 px-4 py-2 border border-white/15 bg-white/5 text-xs text-white uppercase tracking-wider hover:bg-[#38bdf8]/15 hover:border-[#38bdf8]/40 hover:text-[#38bdf8] transition-all duration-200"
          >
            <span>Ver todos los proyectos ({String(projects.length).padStart(2, '0')})</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {/* 3D Drum WorksWheel Component */}
      <div className="w-full">
        <WorksWheel 
          items={wheelItems} 
          label="DOS ORILLAS // CASOS" 
          action="Ver proyecto" 
        />
      </div>
    </section>
  );
}

export default ProjectsWheelSection;
