import { Suspense } from 'react';
import { distanceCopy } from '@/content/site';
import { Media } from '@/components/ui/Media';
import { DistanceMotion } from './SceneMotion';

/** Words sit in their own clipping boxes so the timeline can lift them line by line.
 * The accessible text is the plain sentence; the split copy is presentational. */
function Words({ text, className }: { text: string; className?: string }) {
  return <>
    <span className="sr-only">{text}</span>
    <span className={className} aria-hidden="true">
      {text.split(' ').map((word, index) => <span key={`${word}-${index}`}>
        {index > 0 && ' '}<span className="dw"><span className="dw-in">{word}</span></span>
      </span>)}
    </span>
  </>;
}

const HANGERS = Array.from({ length: 19 }, (_, index) => {
  const t = (index + 1) / 20;
  return { x: 60 + 880 * t, cable: 18 + 224 * t * (1 - t) };
});

export function Distance() {
  const { left, right } = distanceCopy;
  return <section id="distancia" className="distance-scene" data-theme="navy-deep" data-scene="distance" aria-labelledby="distance-title">
    <div className="distance-stage">
      <h2 id="distance-title" className="sr-only">{distanceCopy.title}</h2>

      <div className="distance-atmosphere" aria-hidden="true">
        <canvas className="distance-river" />
        <span className="distance-grain" />
        <span className="distance-vignette" />
      </div>

      <div className="distance-hud" aria-hidden="true">
        <span className="hud-label mono">{left.orilla}</span>
        <span className="hud-rail"><span className="hud-fill" /><span className="hud-mark" /></span>
        <span className="hud-label mono">{right.orilla}</span>
      </div>

      <div className="distance-track">
        <div className="distance-bank distance-left">
          <span className="bank-label mono" aria-hidden="true">{left.orilla}</span>
          <h3 className="bank-word">
            {left.lines.map(line => <span key={line} className="line"><span className="line-in">{line}</span></span>)}
          </h3>
        </div>

        <div className="distance-gap">
          <div className="distance-aerial" aria-hidden="true">
            <Media path="/images/distance/river-aerial.webp" alt="" width={1600} height={1200} sizes="(min-width:768px) 150vw, 100vw" />
          </div>
          <div className="distance-ruler" aria-hidden="true" />
          <span className="distance-gap-label mono" aria-hidden="true">{distanceCopy.measure}</span>
          <p className="distance-description"><Words text={distanceCopy.description} className="dd-text" /></p>
          <svg className="distance-bridge-svg" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line className="bridge-deck" x1="0" y1="100" x2="1000" y2="100" pathLength="1" />
            <line className="bridge-pylon" x1="60" y1="100" x2="60" y2="14" pathLength="1" />
            <line className="bridge-pylon" x1="940" y1="100" x2="940" y2="14" pathLength="1" />
            <path className="bridge-cable" d="M60 18 Q500 130 940 18" pathLength="1" />
            {HANGERS.map(({ x, cable }) => <line key={x} className="bridge-hanger" x1={x} y1={cable} x2={x} y2="100" pathLength="1" />)}
          </svg>
        </div>

        <div className="distance-bank distance-right">
          <span className="bank-label mono" aria-hidden="true">{right.orilla}</span>
          <h3 className="bank-word">
            {right.lines.map(line => <span key={line} className="line"><span className="line-in">{line}</span></span>)}
          </h3>
        </div>

      </div>

      <div className="distance-outro">
        <span className="distance-vline" aria-hidden="true" />
        <p className="distance-connection"><Words text={distanceCopy.connection} className="dc-text" /></p>
      </div>
    </div>
    <Suspense fallback={null}><DistanceMotion /></Suspense>
  </section>;
}
