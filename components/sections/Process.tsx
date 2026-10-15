import { processCopy, processSteps, type ProcessStep } from '@/content/process';

/** These are abstract construction diagrams, not project screenshots or logos. */
function ProcessDiagram({ visual }: { visual: ProcessStep['visual'] }) {
  return <svg className="process-diagram" data-process-diagram={visual} viewBox="0 0 520 180" fill="none" aria-hidden="true" focusable="false">
    {visual === 'think' && <g className="process-construction">
      {[130, 210, 290, 370].map(x => <path key={x} d={`M${x} 28V152`} />)}
      <path d="M30 50H490M30 130H490M260 22V158M28 90H492" />
      <path className="process-cross" d="M246 76L274 104M274 76L246 104" />
    </g>}
    <path className={`process-trace${visual === 'connect' ? ' process-solid-trace' : ''}`} d="M50 90H470" strokeDasharray={visual === 'separate' || visual === 'think' ? '6 9' : undefined} />
    {visual === 'think' && <g className="process-measure-marks">
      {[50, 130, 210, 290, 370, 470].map(x => <path key={x} d={`M${x} 80V100`} />)}
      <path d="M50 117H470M50 111V123M470 111V123" />
    </g>}
    {visual === 'build' && <g className="process-blocks">
      {[90, 210, 330].map((x, index) => <rect key={x} className="process-block" data-process-block={index} x={x} y={62 - index * 4} width="96" height={56 + index * 8} />)}
    </g>}
    <circle className="process-origin" cx="50" cy="90" r="5" />
    <circle className="process-destination" cx="470" cy="90" r="5" />
    {visual === 'connect' && <>
      <circle className="process-traveler" cx="50" cy="90" r="4" />
      <circle className="process-pulse" cx="470" cy="90" r="16" />
    </>}
  </svg>;
}

export function Process() {
  const [firstSentence, secondSentence] = processCopy.subtitle.split(/(?<=\.)\s+/);
  return <section id="proceso" className="process-scene" data-scene="process" data-theme="navy" data-process-mode="flow" data-process-index="0" aria-labelledby="process-title">
    <div className="process-entry-line" data-bridge-chain="process-entry" aria-hidden="true" />
    <div className="process-stage">
      <div className="process-meta">
        <h2 id="process-title" className="mono">{processCopy.title}</h2>
        <div className="process-counter mono" aria-hidden="true">
          <span className="process-counter-window"><span className="process-counter-roll">{processSteps.map(step => <span key={step.number}>{step.number}</span>)}</span></span>
          <span className="process-counter-total">/ {String(processSteps.length).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="process-track">
        <div className="process-opening">
          <p className="process-opening-statement"><span className="process-opening-line">{firstSentence}</span>{' '}<span className="process-opening-line editorial">{secondSentence}</span></p>
        </div>
        <div className="process-journey">
          <div className="process-vertical-bridge" aria-hidden="true"><span className="process-vertical-fill" /></div>
          <ol className="process-steps" role="list">
            {processSteps.map((step, index) => <li key={step.number} className="process-step" data-process-step={index} tabIndex={0} aria-labelledby={`process-step-title-${index}`} aria-describedby={`process-step-description-${index}`}>
              <span className="process-step-number" aria-hidden="true">{step.number}</span>
              <div className="process-step-copy"><h3 id={`process-step-title-${index}`} className="process-step-title">{step.title}</h3><p id={`process-step-description-${index}`} className="process-step-description">{step.description}</p></div>
              <ProcessDiagram visual={step.visual} />
            </li>)}
          </ol>
        </div>
      </div>
      <div className="process-progress" aria-hidden="true">
        <span className="process-progress-track"><span className="process-progress-fill" /></span>
        {processSteps.map((step, index) => <span key={step.number} className="process-progress-mark mono" data-process-mark={index} data-passed="true" style={{ left: `${index / Math.max(1, processSteps.length - 1) * 100}%` }}><span className="process-progress-tick" /><span>{step.number}</span></span>)}
      </div>
    </div>
    <div className="process-exit-line" data-bridge-chain="process-exit" aria-hidden="true" />
  </section>;
}
