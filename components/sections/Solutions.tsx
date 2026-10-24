import type { CSSProperties } from 'react';
import { services, servicesCopy } from '@/content/services';
import { Media } from '@/components/ui/Media';
import { ApproachMotion } from './ApproachMotion';

export function Solutions() {
  const aiLines = servicesCopy.aiDescription.split(/(?<=\.)\s+/);
  return <section id="soluciones" className="ap-act ap-solutions" data-theme="navy-deep" data-nav="dark" data-scene="soluciones" aria-labelledby="solutions-title">
    <div className="ap-stage">
      <header className="ap-sol-head">
        <h2 id="solutions-title" className="ap-sol-title"><span className="ap-line"><span className="ap-line-in">{servicesCopy.title}</span></span></h2>
        <p className="ap-sol-sub"><span className="ap-line"><span className="ap-line-in">{servicesCopy.subtitle}</span></span></p>
      </header>

      <ul className="ap-services">
        {services.map((service, index) => <li className="ap-service" data-service={service.id} key={service.id} style={{ '--i': index } as CSSProperties}>
          <div className="ap-service-name">
            <h3 className="ap-name" style={{ '--chars': service.name.length } as CSSProperties}><span className="ap-line"><span className="ap-line-in">{service.name}</span></span></h3>
            <span className="ap-name-rule" aria-hidden="true" />
          </div>
          <div className="ap-service-detail">
            <p className="ap-full mono">{service.title}</p>
            <p className="ap-desc">{service.description}</p>
          </div>
          <figure className="ap-service-media">
            <div className="ap-slide">
              <Media path={service.media.src} alt={service.media.alt} width={service.media.width} height={service.media.height}
                sizes="(max-width: 767px) 92vw, (max-width: 1099px) 46vw, 24vw" />
            </div>
          </figure>
        </li>)}
      </ul>

      <div className="ap-ai">
        <p className="ap-ai-label mono">{servicesCopy.aiLabel}</p>
        <p className="ap-ai-copy">{aiLines.map(line => <span className="ap-line" key={line}><span className="ap-line-in">{line}</span></span>)}</p>
      </div>
      <span className="ap-grain" aria-hidden="true" />
    </div>
    <ApproachMotion />
  </section>;
}
