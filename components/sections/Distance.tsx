import { Suspense } from 'react';
import { distanceCopy } from '@/content/site';
import { DistanceMotion } from './SceneMotion';

/** Words sit in their own clipping boxes so the timeline can lift them one by one.
 * The split text is the only copy in the DOM (the spaces between words are real text nodes),
 * so copy, search and assistive tech read a single sentence. `strong` marks the closing word. */
function Words({ text, className, strong }: { text: string; className?: string; strong?: boolean }) {
  const words = text.split(' ');
  return <span className={className}>
    {words.map((word, index) => <span key={`${word}-${index}`}>
      {index > 0 && ' '}<span className="dw"><span className={`dw-in${strong && index === words.length - 1 ? ' dw-strong' : ''}`}>{word}</span></span>
    </span>)}
  </span>;
}

export function Distance() {
  const { left, right } = distanceCopy;
  return <section id="distancia" className="distance-scene" data-theme="navy-deep" data-scene="distance" aria-labelledby="distance-title">
    <div className="distance-runway">
      <div className="distance-stage">
        <h2 id="distance-title" className="sr-only">{distanceCopy.title}</h2>

        {/* «Nosotros»: la partícula que cruza de una orilla a la otra (la mueve distance-crossing.ts). */}
        <span className="distance-particle" aria-hidden="true" />

        <div className="distance-hud" aria-hidden="true">
          <span className="hud-label mono">{left.orilla}</span>
          <span className="hud-rail"><span className="hud-fill" /><span className="hud-mark" /></span>
          <span className="hud-label mono">{right.orilla}</span>
        </div>

        <div className="distance-track">
          <div className="distance-bank distance-left">
            <span className="bank-edge" aria-hidden="true" />
            <h3 className="bank-word">
              {left.lines.map(line => <span key={line} className="line"><span className="line-in">{line}</span></span>)}
            </h3>
          </div>

          <div className="distance-gap">
            <p className="distance-description"><Words text={distanceCopy.description} className="dd-text" /></p>
          </div>

          <div className="distance-bank distance-right">
            <span className="bank-edge" aria-hidden="true" />
            <h3 className="bank-word">
              {right.lines.map(line => <span key={line} className="line"><span className="line-in">{line}</span></span>)}
            </h3>
          </div>

        </div>
      </div>
    </div>

    {/* El cierre vive fuera del escenario fijado: al llegar a la otra orilla el scroll sigue hacia abajo. */}
    <div className="distance-outro">
      <span className="distance-vline" aria-hidden="true" />
      <p className="distance-connection"><Words text={distanceCopy.connection} className="dc-text" strong /></p>
    </div>
    <Suspense fallback={null}><DistanceMotion /></Suspense>
  </section>;
}
