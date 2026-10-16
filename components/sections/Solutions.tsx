import { services, servicesCopy } from '@/content/services';
import { Media } from '@/components/ui/Media';
import { GlassFold } from '@/components/ui/glass-fold';

export function Solutions() {
  return <section id="soluciones" className="solutions-section" data-theme="navy-deep" data-nav="dark" aria-labelledby="solutions-title">
    {/* Full-bleed GlassFold WebGL Ambient Background */}
    <div className="solutions-auralis-backdrop" aria-hidden="true">
      <GlassFold
        color1="#0c2d4a"
        color2="#06121d"
        color3="#2575a2"
        speed={0.3}
        scale={1.0}
        noise={0.04}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      <div className="solutions-backdrop-vignette" />
      <div className="solutions-backdrop-grain" />
      <div className="solutions-bg-mask-top" />
      <div className="solutions-bg-mask-bottom" />
    </div>

    <header className="solutions-header">
      <h2 id="solutions-title">{servicesCopy.title}</h2>
      <p>{servicesCopy.subtitle}</p>
    </header>
    <div className="solutions-list">
      <span className="solutions-ai-line" aria-hidden="true" />
      {services.map(service => <article className="solutions-row" data-service={service.id} key={service.id}>
        <h3 className="solutions-heading">
          <span className="solutions-ai-mark" aria-hidden="true" />
          <button className="solutions-trigger" id={`solution-trigger-${service.id}`} type="button" suppressHydrationWarning aria-controls={`solution-panel-${service.id}`} aria-expanded="true" aria-disabled="true" tabIndex={-1}>
            <span className="solutions-number mono" aria-hidden="true">{service.number}</span>
            <span className="solutions-hairline" aria-hidden="true"><span className="solutions-hairline-draw"><span className="solutions-line" /></span></span>
            <span className="solutions-name-mask"><span className="solutions-name"><span className="solutions-name-inner">{service.name}</span></span></span>
            <span className="solutions-toggle" aria-hidden="true" />
          </button>
        </h3>
        <div id={`solution-panel-${service.id}`} className="solutions-panel" role="region" aria-labelledby={`solution-trigger-${service.id}`}>
          <div className="solutions-panel-inner">
            <div className="solutions-copy"><p className="solutions-full-title mono">{service.title}</p><p className="solutions-description">{service.description}</p></div>
            <div className="solutions-media">
              <Media path={service.media.src} alt={service.media.alt} width={service.media.width} height={service.media.height} sizes="(max-width: 1023px) 220px, 24vw" focal={service.media.focal} />
            </div>
          </div>
        </div>
      </article>)}
    </div>
    <div className="solutions-ai">
      <p className="mono solutions-ai-label">{servicesCopy.aiLabel}</p>
      <p className="solutions-ai-copy">{servicesCopy.aiDescription.split(/(?<=\.)\s+/).map(line => <span className="solutions-ai-mask" key={line}><span className="solutions-ai-text">{line}</span></span>)}</p>
    </div>
    <div className="solutions-exit" data-bridge-chain="solutions-exit" aria-hidden="true"><span className="solutions-exit-line" /></div>
  </section>;
}
