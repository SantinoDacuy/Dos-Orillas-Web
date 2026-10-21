import { manifestoCopy } from '@/content/site';
import { Media } from '@/components/ui/Media';
import { ApproachMotion } from './ApproachMotion';

/** Una línea por máscara: el cronograma las levanta de a una. */
function Lines({ lines, strikeAt, emphasisAt }: { lines: readonly string[]; strikeAt?: number; emphasisAt?: number }) {
  return <>{lines.map((line, index) => <span className="ap-line" key={line}>
    <span className={`ap-line-in${index === emphasisAt ? ' ap-emphasis' : ''}`}>
      {index === strikeAt
        ? <span className="ap-struck">{line}<span className="ap-strike" aria-hidden="true" /></span>
        : index === emphasisAt
          ? <span className="ap-underlined">{line}<span className="ap-underline" aria-hidden="true" /></span>
          : line}
    </span>
  </span>)}</>;
}

export function Manifesto() {
  return <section id="manifiesto" className="ap-act ap-manifesto" data-theme="navy-deep" data-scene="manifiesto" aria-labelledby="manifesto-title">
    <div className="ap-stage">
      <h2 id="manifesto-title" className="sr-only">{manifestoCopy.title}</h2>

      <div className="ap-telemetry mono" aria-hidden="true">
        <span className="ap-telemetry-badge"><span className="ap-dot" />02 // MANIFIESTO</span>
      </div>

      <div className="ap-beat ap-beat-a">
        <div className="ap-photo" aria-hidden="true">
          <Media path="/images/approach/manifest-a.webp" alt="" width={1916} height={755} sizes="100vw" />
        </div>
        <span className="ap-veil" aria-hidden="true" />
        <p className="ap-statement ap-statement-a"><Lines lines={manifestoCopy.firstLines} strikeAt={2} /></p>
      </div>

      <div className="ap-beat ap-beat-b">
        <div className="ap-photo" aria-hidden="true">
          <Media path="/images/approach/manifest-b.webp" alt="" width={1916} height={821} sizes="100vw" />
        </div>
        <span className="ap-veil" aria-hidden="true" />
        <span className="ap-dusk" aria-hidden="true" />
        <p className="ap-statement ap-statement-b"><Lines lines={manifestoCopy.secondLines} emphasisAt={2} /></p>
      </div>

      <span className="ap-grain" aria-hidden="true" />
    </div>
    <ApproachMotion scene="manifiesto" />
  </section>;
}
