import type { CSSProperties } from 'react';
import { services, servicesCopy } from '@/content/services';
import { ApproachMotion } from './ApproachMotion';

export function Solutions() {
  const [lead, glow] = servicesCopy.subtitle;
  return <section id="soluciones" className="ap-act ap-solutions" data-theme="navy-deep" data-nav="dark" data-scene="soluciones" aria-labelledby="solutions-title">
    <div className="ap-stage">
      <header className="ap-sol-head">
        <p className="ap-sol-kicker mono">{servicesCopy.title}</p>
        <h2 id="solutions-title" className="ap-sol-title">
          <span className="ap-line"><span className="ap-line-in">{lead} <span className="text-glow">{glow}</span></span></span>
        </h2>
      </header>

      {/* Tarjetas: el <li> revela (opacidad y desplazamiento) y la tarjeta interior flota; así no compiten. */}
      <ul className="ap-services">
        {services.map((service, index) => <li className="ap-service" data-service={service.id} key={service.id} style={{ '--d': index } as CSSProperties}>
          <article className="trio-card">
            <span className="trio-n">{service.number}</span>
            <h3 className="trio-title">{service.title}</h3>
            <p className="trio-desc">{service.description}</p>
          </article>
        </li>)}
      </ul>

    </div>
    <ApproachMotion />
  </section>;
}
