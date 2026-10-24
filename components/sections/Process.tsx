import type { CSSProperties } from 'react';
import { processCopy, processSteps } from '@/content/process';
import { SectionReveal } from './SectionReveal';

/** Cómo trabajamos: lectura plana. Cuatro pasos sobre una sola línea (el puente) y nada fijado. */
export function Process() {
  const [first, second] = processCopy.subtitle.split(/(?<=\.)\s+/);
  return <section id="proceso" className="pr" data-theme="navy" data-nav="dark" data-scene="proceso" aria-labelledby="process-title">
    <div className="pr-wrap">
      <header className="pr-head" data-reveal>
        <p className="pr-eyebrow mono">{processCopy.title}</p>
        <h2 id="process-title" className="pr-title">
          <span className="pr-line"><span className="pr-line-in">{first}</span></span>
          <span className="pr-line pr-accent"><span className="pr-line-in">{second}</span></span>
        </h2>
      </header>

      <ol className="pr-steps">
        {processSteps.map((step, index) => <li className="pr-step" key={step.number} data-reveal style={{ '--i': index } as CSSProperties}>
          <div className="pr-rail" aria-hidden="true"><span className="pr-node" /><span className="pr-rail-line" /></div>
          <span className="pr-num mono">{step.number}</span>
          <h3 className="pr-step-title">{step.title}</h3>
          <p className="pr-step-desc">{step.description}</p>
        </li>)}
      </ol>
    </div>
    <SectionReveal selector="#proceso" />
  </section>;
}
