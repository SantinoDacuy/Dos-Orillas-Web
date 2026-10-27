'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { teamCopy } from '@/content/team';

const MEMBERS = teamCopy.members;

/** Equipo: el carrusel de personajes (central nítido, el otro a un costado, se cambia con las flechas, el teclado o
 * tocando al de costado) con el perfil del que está al frente. Mismo lenguaje que Soluciones: Inter, degradado en el
 * remate del titular, superficie translúcida con borde de luz y el fondo global de la página. */
export function Team() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const go = useCallback((index?: number) => {
    setActive(previous => (typeof index === 'number' ? index : (previous + 1) % MEMBERS.length));
  }, []);

  // ← → cambian de persona sólo con la sección en pantalla y el foco fuera de un campo de texto.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const section = sectionRef.current;
      const element = document.activeElement;
      if (!section || element?.matches('input, textarea, select')) return;
      const box = section.getBoundingClientRect();
      if (box.top > innerHeight * .5 || box.bottom < innerHeight * .5) return;
      go(event.key === 'ArrowRight' ? (active + 1) % MEMBERS.length : (active + MEMBERS.length - 1) % MEMBERS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  const [lead, glow] = teamCopy.title;
  const current = MEMBERS[active] ?? MEMBERS[0];
  return <section id="equipo" ref={sectionRef} className="tm" data-theme="navy-deep" data-nav="dark" aria-labelledby="team-title">
    <header className="tm-head">
      <p className="tm-kicker mono">{teamCopy.kicker}</p>
      <h2 id="team-title" className="tm-title">{lead} <span className="text-glow">{glow}</span></h2>
    </header>

    <div className="tm-body">
      {/* Carrusel de personajes */}
      <div className="tm-stage" aria-roledescription="carrusel" aria-label="Integrantes del equipo">
        <span className="tm-ghost" aria-hidden="true" key={current.id}>{current.ghost}</span>
        <span className="tm-halo" aria-hidden="true" />
        {MEMBERS.map((member, index) => {
          const position = index === active ? 'center' : index === 0 ? 'left' : 'right';
          return <button key={member.id} type="button" className="tm-figure" data-pos={position}
            onClick={() => index !== active && go(index)} tabIndex={index === active ? -1 : 0}
            aria-label={index === active ? member.name : `Ver a ${member.name}`} aria-pressed={index === active}>
            <Image src={member.image} alt="" width={600} height={1000} sizes="(max-width: 767px) 60vw, 28vw" draggable={false} priority={false} />
          </button>;
        })}
      </div>

      {/* Perfil del que está al frente: los dos están en el DOM (se cruzan), el inactivo queda inerte. */}
      <div className="tm-profiles">
        {MEMBERS.map((member, index) => <article key={member.id} className="tm-card" data-active={index === active}
          aria-hidden={index !== active} inert={index !== active} style={{ '--d': index } as CSSProperties}>
          <span className="tm-n">{member.number}</span>
          <h3 className="tm-name">{member.name}</h3>
          <p className="tm-role mono">{member.role}</p>
          <p className="tm-edu">{member.education}</p>
          <p className="tm-bio">{member.bio}</p>
          <ul className="tm-focus" aria-label={`Especialidades de ${member.name}`}>
            {member.focus.map(item => <li key={item}>{item}</li>)}
          </ul>
          <a className="btn btn-ghost btn-sm tm-contact" href={teamCopy.contactHref}>
            <span>{teamCopy.contactLabel}</span><span className="btn-icon" aria-hidden="true">→</span>
          </a>
        </article>)}

        <div className="tm-nav">
          <button type="button" className="tm-step" onClick={() => go((active + MEMBERS.length - 1) % MEMBERS.length)} aria-label="Integrante anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <span className="tm-count mono" aria-live="polite"><b>{String(active + 1).padStart(2, '0')}</b> / {String(MEMBERS.length).padStart(2, '0')}</span>
          <button type="button" className="tm-step" onClick={() => go()} aria-label="Integrante siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  </section>;
}
