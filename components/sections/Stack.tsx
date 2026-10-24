import type { CSSProperties } from 'react';
import { finalCtaCopy } from '@/content/site';
import { TechIcon, TECH_METADATA } from '@/components/ui/tech-icons';
import { SectionReveal } from './SectionReveal';

interface Layer {
  id: 'interface' | 'server' | 'data';
  tag: string;
  eyebrow: string;
  title: string;
  desc: string;
  technologies: readonly string[];
}

const LAYERS: readonly Layer[] = [
  {
    id: 'interface', tag: 'Interfaz', eyebrow: 'Interfaces & web', title: 'Frontend & Experiencia',
    desc: 'Interfaces interactivas, renderizado optimizado y sistemas de diseño consistentes.',
    technologies: ['Next.js', 'React', 'TypeScript', 'JavaScript', 'GSAP', 'Tailwind', 'Figma'],
  },
  {
    id: 'server', tag: 'Servidor', eyebrow: 'Servidores & lógica', title: 'Backend & Arquitectura',
    desc: 'APIs REST, pipelines de datos y entornos contenerizados listos para producción.',
    technologies: ['Node.js', 'Python', 'APIs REST', 'Supabase', 'Docker', 'AWS'],
  },
  {
    id: 'data', tag: 'Datos', eyebrow: 'Persistencia & rendimiento', title: 'Bases de Datos & Caché',
    desc: 'Modelos de datos robustos, integridad relacional y almacenamiento de alta velocidad.',
    technologies: ['PostgreSQL', 'SQL', 'Redis', 'MongoDB'],
  },
];

const line = (text: string) => <span className="st-line"><span className="st-line-in">{text}</span></span>;

/** Criterio & Stack + cierre: una sola sección compacta. El servidor entrega todo el texto;
 * `SectionReveal` sólo agrega los reveals al entrar en pantalla. `#hablemos` queda como ancla interna. */
export function Stack() {
  const premise = finalCtaCopy.lines;
  return <section id="herramientas" className="st" data-theme="navy-deep" data-nav="dark" data-scene="stack" aria-labelledby="stack-heading">
    <div className="st-atmosphere" aria-hidden="true"><span className="st-vignette" /><span className="st-grain" /></div>

    <div className="st-wrap">
      <header className="st-head" data-reveal>
        <p className="st-eyebrow mono">Criterio &amp; stack</p>
        <h2 id="stack-heading" className="st-title">
          {line('LAS HERRAMIENTAS CAMBIAN.')}
          <span className="st-accent">{line('EL CRITERIO NO.')}</span>
        </h2>
      </header>

      <ol className="st-layers">
        {LAYERS.map((layer, index) => <li className="st-layer" key={layer.id} data-reveal data-layer={layer.id} style={{ '--i': index } as CSSProperties}>
          <div className="st-spine" aria-hidden="true">
            <span className="st-tag mono">{layer.tag}</span>
            <span className="st-spine-line" />
            <span className="st-node" />
          </div>
          <p className="st-layer-eyebrow mono">{layer.eyebrow}</p>
          <h3 className="st-layer-title">{layer.title}</h3>
          <p className="st-layer-desc">{layer.desc}</p>
          <ul className="st-chips" aria-label={`Tecnologías de ${layer.title}`}>
            {layer.technologies.map(tech => <li className="st-chip mono" key={tech} style={{ '--brand': TECH_METADATA[tech]?.brandColor ?? 'var(--accent)' } as CSSProperties}>
              <span className="st-chip-icon" aria-hidden="true"><TechIcon name={tech} /></span>{tech}
            </li>)}
          </ul>
        </li>)}
      </ol>

      <div className="st-criterio" data-reveal>
        <p className="st-kicker mono">El criterio ante todo</p>
        <p className="st-claim">No llegamos con una herramienta predeterminada.</p>
        <p className="st-analysis">
          Analizamos <b>El problema real</b>, <b>La escala requerida</b> y <b>Los recursos</b> para seleccionar la tecnología adecuada.
        </p>
      </div>

      <div id="hablemos" className="st-cta">
        <p className="st-premise" data-reveal>{premise.map((text, index) =>
          <span className={index === premise.length - 1 ? 'st-premise-line st-accent' : 'st-premise-line'} key={text}>{text}</span>)}
        </p>
        <div className="st-cta-main" data-reveal>
          <h2 className="st-cta-title">{finalCtaCopy.title}<span className="st-cta-bridge" aria-hidden="true" /></h2>
          <a className="btn btn-primary st-cta-link" href={finalCtaCopy.cta.href} aria-label={finalCtaCopy.cta.label} data-reveal-link>
            <span>Contanos qué querés resolver</span>
            <span className="btn-icon" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
    <SectionReveal selector="#herramientas" />
  </section>;
}
