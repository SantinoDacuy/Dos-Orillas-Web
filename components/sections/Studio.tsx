import type { CSSProperties } from 'react';
import Image from 'next/image';
import { studioCopy } from '@/content/site';
import { SHOWCASE_PROJECTS } from './ProjectsCinematicSection';
import { StudioMotion } from './StudioMotion';

/** Mosaico 3D de las portadas de los proyectos (inspirado en «3D Marquee» de Aceternity, reescrito en CSS sin
 * dependencias): cuatro columnas en un plano inclinado que derivan en sentidos opuestos. Cada columna empieza en
 * un proyecto distinto para que ninguna fila repita la de al lado. Decorativo: el texto va por encima. */
const COLUMNS = 4;
const PER_COLUMN = 5;
const covers = SHOWCASE_PROJECTS.map(project => project.imagen);
const columns = Array.from({ length: COLUMNS }, (_, column) =>
  Array.from({ length: PER_COLUMN }, (_, row) => covers[(column * 2 + row) % covers.length]!));

export function Studio() {
  return <section id="el-estudio" className="es" data-theme="navy-deep" data-nav="dark" data-scene="estudio" aria-labelledby="studio-heading">
    <div className="es-marquee" aria-hidden="true">
      <div className="es-mq-plane">
        <div className="es-mq-grid">
          {columns.map((images, column) => <div className="es-mq-col" key={column} style={{ '--c': column } as CSSProperties}>
            {images.map((src, row) => <div className="es-mq-item" key={`${column}-${row}`}>
              <Image src={src} alt="" width={970} height={700} sizes="420px" loading="lazy" />
            </div>)}
          </div>)}
        </div>
      </div>
    </div>

    <div className="es-stage">
      <h2 id="studio-heading" className="es-headline">
        {studioCopy.headline.map((line, index) => <span className={`es-line es-line-${index + 1}`} key={line}>
          <span className="es-line-in">{line}</span>
        </span>)}
      </h2>

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
