import { finalCtaCopy } from '@/content/site';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

/** Canonical chapters identify this section as hablemos; contacto is its target. */
export function FinalCTA() {
  const section = <section id="hablemos" className="final-cta-section editorial-section" data-editorial="cta"
    data-theme="navy-deep" data-nav="dark" aria-labelledby="final-cta-heading">
    <div className="final-cta-inner">
      <p className="final-cta-premise"><EditorialLines lines={finalCtaCopy.lines} accentLast /></p>
      <h2 id="final-cta-heading" className="final-cta-title">{finalCtaCopy.title}
        <span className="final-cta-bridge" aria-hidden="true" data-editorial-bridge />
      </h2>
      <a className="final-cta-link" href={finalCtaCopy.cta.href} aria-label={finalCtaCopy.cta.label} data-final-cta>
        <span className="final-cta-fill" aria-hidden="true" />
        <span className="final-cta-link-text">{finalCtaCopy.cta.label.slice(0, -1).trimEnd()}</span>
        <span className="final-cta-arrow" aria-hidden="true">{finalCtaCopy.cta.label.slice(-1)}</span>
        <span className="final-cta-button-bridge" aria-hidden="true" />
      </a>
      <p className="final-cta-location">{finalCtaCopy.location}</p>
    </div>
  </section>;
  return staticSection(section);
}
