import { studioCopy } from '@/content/site';
import { Media } from '@/components/ui/Media';
import { StudioMotion } from './StudioMotion';

const HEADLINE = ['DOS PERSONAS.', 'DOS ORILLAS.', 'UNA MISMA FORMA DE TRABAJAR.'] as const;

export function Studio() {
  return <section id="el-estudio" className="es" data-theme="navy-deep" data-nav="dark" data-scene="estudio" aria-labelledby="studio-heading">
    <div className="es-stage">
      <div className="es-atmosphere" aria-hidden="true">
        <span className="es-vignette" />
        <span className="es-grain" />
      </div>

      <h2 id="studio-heading" className="es-headline">
        {HEADLINE.map((line, index) => <span className={`es-line es-line-${index + 1}`} key={line}>
          <span className="es-line-in">{line}</span>
        </span>)}
      </h2>

      <figure className="es-photo" aria-hidden="true">
        <div className="es-photo-frame">
          <Media path="/images/studio/notebook.webp" alt="" width={1200} height={1600} sizes="(min-width:1024px) 26vw, 88vw" />
          <span className="es-photo-veil" />
        </div>
      </figure>

      <div className="es-read">
        <p className="es-lead">{studioCopy.lead.split(' ').map((word, index) => <span key={`${word}-${index}`}>
          {index > 0 && ' '}<span className="es-w">{word}</span>
        </span>)}</p>
        <p className="es-paragraph">{studioCopy.paragraph}</p>
      </div>

      {/* Puente entre dos orillas: la línea cruza el ancho y las coordenadas quedan en el centro. */}
      <div className="es-bridge" aria-hidden="true">
        <span className="es-node es-node-left" />
        <span className="es-bridge-line"><span className="es-bridge-draw" /></span>
        <span className="es-node es-node-right" />
        <span className="es-coords mono">{studioCopy.coordinates}</span>
      </div>
    </div>
    <StudioMotion />
  </section>;
}
