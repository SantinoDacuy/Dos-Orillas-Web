import { stackCopy, technologies } from '@/content/stack';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

export function Stack() {
  const rows = [technologies.slice(0, Math.ceil(technologies.length / 2)), technologies.slice(Math.ceil(technologies.length / 2))];
  const section = <section id="herramientas" className="stack-section editorial-section" data-editorial="stack"
    data-theme="cream" data-nav="light" aria-labelledby="stack-heading">
    <header className="stack-header"><h2 id="stack-heading" className="stack-headline">
      <EditorialLines lines={stackCopy.title} />
    </h2></header>
    <div className="stack-tools">
      <ul className="stack-list">{technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
      <div className="stack-marquees" aria-hidden="true">
        <span className="stack-criterion" />
        {rows.map((row, index) => <div className="stack-marquee-viewport" key={index}>
          <div className="stack-marquee-track" data-marquee-direction={index === 0 ? 'forward' : 'reverse'}>
            {[0, 1].map(copy => <div className="stack-marquee-loop" key={copy}>{row.map(technology =>
              <span key={technology}>{technology}</span>)}</div>)}
          </div>
        </div>)}
      </div>
    </div>
    <p className="stack-description">{stackCopy.description}</p>
  </section>;
  return staticSection(section);
}
