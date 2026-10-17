'use client';

import { teamCopy } from '@/content/team';
import { EditorialLines } from './EditorialLines';
import { useState, useCallback, type MouseEvent } from 'react';

interface MemberProfile {
  id: string;
  code: string;
  number: string;
  initials: string;
  name: string;
  role: string;
  degree: string;
  focus: string[];
  accentColor: string;
  glowColor: string;
}

const MEMBERS: MemberProfile[] = [
  {
    id: 'santino',
    code: 'ID #01-SD',
    number: '01',
    initials: 'SD',
    name: 'Santino Dacuy',
    degree: 'Analista en Sistemas · Licenciatura en Sistemas de Información en curso',
    role: 'Frontend, Arquitectura & Experiencia Digital',
    focus: ['Frontend & UX/UI', 'Arquitectura Web', 'Bases de Datos & SQL', 'Estrategia de Producto'],
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
  },
  {
    id: 'tobias',
    code: 'ID #02-TC',
    number: '02',
    initials: 'TC',
    name: 'Tobías Carballo',
    degree: 'Analista en Sistemas',
    role: 'Backend, Integraciones & Lógica de Negocio',
    focus: ['Backend & APIs REST', 'Sistemas a Medida', 'Modelado de Datos', 'Optimización de Procesos'],
    accentColor: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.35)',
  },
];

export function Team() {
  const [mousePos, setMousePos] = useState<Record<string, { x: number; y: number }>>({});

  const handleMouseMove = useCallback((id: string, e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  return (
    <section
      id="equipo"
      className="team-section editorial-section radiant-section-wrap"
      data-editorial="team"
      data-theme="navy-deep"
      data-nav="dark"
      aria-labelledby="team-heading"
    >
      {/* Ambient background glows */}
      <div className="radiant-ambient-glow radiant-glow-cyan" style={{ width: '600px', height: '600px', top: '15%', right: '-8%' }} aria-hidden="true" />
      <div className="radiant-ambient-glow radiant-glow-blue" style={{ width: '550px', height: '550px', bottom: '-10%', left: '-5%' }} aria-hidden="true" />

      <header className="team-header relative z-10">
        <div className="radiant-badge mb-6">
          <span className="radiant-beacon" />
          <span>02 · Equipo</span>
        </div>
        <h2 id="team-heading" className="team-headline">
          <EditorialLines lines={teamCopy.title} accentIndex={1} />
        </h2>
      </header>

      <div className="team-radiant-grid relative z-10">
        {MEMBERS.map(member => {
          const pos = mousePos[member.id] || { x: 250, y: 150 };
          return (
            <div
              key={member.id}
              className="dossier-card"
              style={{
                '--mouse-x': `${pos.x}px`,
                '--mouse-y': `${pos.y}px`,
              } as React.CSSProperties}
              onMouseMove={e => handleMouseMove(member.id, e)}
            >
              {/* Header Bar */}
              <div className="dossier-header-bar">
                <span className="dossier-id-tag">{member.code}</span>
                <span className="dossier-status-pill">
                  <span className="status-dot-active" />
                  <span>En línea</span>
                </span>
              </div>

              {/* Holographic Monogram Emblem */}
              <div className="hologram-avatar-wrap">
                <div className="hologram-ring-outer" />
                <div
                  className="hologram-ring-inner"
                  style={{
                    boxShadow: `0 0 35px ${member.glowColor}, inset 0 0 20px ${member.glowColor}`,
                    borderColor: member.accentColor,
                  }}
                >
                  <span className="hologram-monogram">{member.initials}</span>
                </div>
              </div>

              {/* Bio & Details */}
              <h3 className="dossier-name">{member.name}</h3>
              <p className="dossier-degree">{member.degree}</p>

              <div className="dossier-location">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Concepción del Uruguay · Entre Ríos</span>
              </div>

              {/* Focus Specialization Pills */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="dossier-pills-title">Especialidad & Enfoque</p>
                <div className="dossier-pills">
                  {member.focus.map(tag => (
                    <span key={tag} className="dossier-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
