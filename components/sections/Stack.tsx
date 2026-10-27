import type { CSSProperties } from 'react';
import { stackCopy } from '@/content/stack';
import { SectionReveal } from './SectionReveal';

/** Criterio & stack: el titular con su premisa y tres capas (interfaz, servidor, datos), cada una con una línea y sus
 * herramientas. Mismo lenguaje que Soluciones (Inter, degradado en el remate, columnas con hairline). El servidor
 * entrega todo el texto; `SectionReveal` sólo agrega los reveals al entrar en pantalla. */
export function Stack() {
  const [lead, glow] = stackCopy.title;
  return <section id="herramientas" className="st" data-theme="navy-deep" data-nav="dark" data-scene="stack" aria-labelledby="stack-heading">
    <div className="st-wrap">
      <header className="st-head" data-reveal>
        <div>
          <p className="st-kicker mono">{stackCopy.kicker}</p>
          <h2 id="stack-heading" className="st-title"><span className="st-title-line">{lead}</span> <span className="st-title-line"><span className="text-glow">{glow}</span></span></h2>
        </div>
        <p className="st-lead">{stackCopy.lead}</p>
      </header>

      <ol className="st-layers">
        {stackCopy.layers.map((layer, index) => <li className="st-layer" key={layer.id} data-reveal style={{ '--i': index } as CSSProperties}>
          <p className="st-tag mono">{layer.tag}</p>
          <h3 className="st-layer-title">{layer.title}</h3>
          <p className="st-layer-desc">{layer.description}</p>
          <ul className="st-tech" aria-label={`Herramientas de ${layer.tag.toLowerCase()}`}>
            {layer.technologies.map(tech => <li key={tech}>{tech}</li>)}
          </ul>
        </li>)}
      </ol>
    </div>
    <SectionReveal selector="#herramientas" />
  </section>;
}
