import { distanceCopy } from '@/content/site';
import { DistanceMotion } from './SceneMotion';
import { Suspense } from 'react';
import { GlassFold } from '@/components/ui/glass-fold';

const statementPhases = ['DIAGNÓSTICO', 'ESTRATEGIA', 'DESARROLLO'] as const;

export function Distance() {
  return <section id="distancia" className="distance-scene" data-theme="navy-deep" data-scene="distance" aria-labelledby="distance-title">
    <div className="distance-stage">
      {/* Full-bleed GlassFold WebGL Ambient Background */}
      <div className="distance-glassfold-backdrop" aria-hidden="true">
        <GlassFold
          color1="#0c355e"
          color2="#071725"
          color3="#38bdf8"
          speed={0.4}
          scale={1.05}
          noise={0.06}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
        <div className="distance-backdrop-vignette" />
      </div>

      <h2 id="distance-title" className="sr-only">{distanceCopy.title}</h2>
      <div className="distance-topline">
        <div className="shore-badge shore-left">
          <span className="shore-pulse" aria-hidden="true" />
          <span className="mono shore-label">{distanceCopy.left.orilla}</span>
          <span className="mono shore-role">// NEGOCIO</span>
        </div>
        <div className="shore-badge shore-right">
          <span className="mono shore-role">TECNOLOGÍA //</span>
          <span className="mono shore-label">{distanceCopy.right.orilla}</span>
          <span className="shore-pulse" aria-hidden="true" />
        </div>
      </div>
      <div className="distance-worlds">
        <div className="distance-world distance-left"><h3><span>{distanceCopy.left.lines[0]}</span><span>{distanceCopy.left.lines[1]}</span></h3></div>
        <div className="distance-world distance-right"><h3><span>{distanceCopy.right.lines[0]}</span><span>{distanceCopy.right.lines[1]}</span></h3></div>
      </div>
      <div className="distance-measure" aria-hidden="true">
        <span className="measure-cap" />
        <span className="measure-line" />
        <div className="measure-bridge-core">
          <span className="measure-label mono">{distanceCopy.measure}</span>
          <span className="measure-bridge-node">
            <span className="measure-bridge-glow" />
          </span>
        </div>
        <span className="measure-line" />
        <span className="measure-cap" />
      </div>
      <p className="distance-description">{distanceCopy.description}</p>
      <div className="distance-connection"><span className="distance-bridge" aria-hidden="true"/><p className="distance-connection-text">{distanceCopy.connection}</p></div>
      <div className="distance-statements">{distanceCopy.statements.map((statement,index) => (
        <div key={statement} className={`distance-statement statement-${index}`}>
          <div className="statement-head">
            <span className="statement-badge mono">
              <span className="statement-dot" aria-hidden="true" />
              <span className="statement-number">FASE 0{index+1}</span>
            </span>
            <span className="statement-role mono">{statementPhases[index]}</span>
          </div>
          <p className="statement-text">{statement}</p>
        </div>
      ))}</div>
      <div className="distance-endline" aria-hidden="true" />
    </div>
    <Suspense fallback={null}><DistanceMotion /></Suspense>
  </section>;
}
