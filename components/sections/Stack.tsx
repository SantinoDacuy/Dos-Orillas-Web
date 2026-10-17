import { stackCopy, technologies } from '@/content/stack';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

export function Stack() {
  const section = (
    <section
      id="herramientas"
      className="stack-section editorial-section radiant-section-wrap"
      data-editorial="stack"
      data-theme="navy-deep"
      data-nav="dark"
      aria-labelledby="stack-heading"
    >
      {/* Ambient background glows */}
      <div className="radiant-ambient-glow radiant-glow-teal" style={{ width: '550px', height: '550px', top: '10%', left: '-5%' }} aria-hidden="true" />
      <div className="radiant-ambient-glow radiant-glow-cyan" style={{ width: '600px', height: '600px', bottom: '0%', right: '-5%' }} aria-hidden="true" />

      <header className="stack-header relative z-10">
        <div className="radiant-badge mb-6">
          <span className="radiant-beacon" />
          <span>03 · Criterio & Stack</span>
        </div>
        <h2 id="stack-heading" className="stack-headline">
          <EditorialLines lines={stackCopy.title} accentIndex={0} />
        </h2>
        <p className="stack-description mt-6 text-slate-300">
          {stackCopy.description}
        </p>
      </header>

      {/* Radiant Bento Matrix */}
      <div className="stack-bento-grid relative z-10">
        {/* Card 1: Frontend */}
        <div className="stack-bento-card">
          <div className="stack-bento-header">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="stack-bento-tag">Interfaces & Web</span>
          </div>
          <h3 className="stack-bento-title">Frontend & Experiencia</h3>
          <p className="stack-bento-desc">
            Interfaces interactivas, renderizado optimizado y sistemas de diseño consistentes.
          </p>
          <div className="stack-chips">
            {['Next.js', 'React', 'TypeScript', 'JavaScript', 'GSAP', 'Tailwind', 'Figma'].map(tech => (
              <span key={tech} className="stack-chip">{tech}</span>
            ))}
          </div>
        </div>

        {/* Card 2: Backend */}
        <div className="stack-bento-card">
          <div className="stack-bento-header">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="stack-bento-tag">Servidores & Lógica</span>
          </div>
          <h3 className="stack-bento-title">Backend & Arquitectura</h3>
          <p className="stack-bento-desc">
            APIs REST, pipelines de datos y entornos contenerizados listos para producción.
          </p>
          <div className="stack-chips">
            {['Node.js', 'Python', 'APIs REST', 'Supabase', 'Docker', 'AWS'].map(tech => (
              <span key={tech} className="stack-chip">{tech}</span>
            ))}
          </div>
        </div>

        {/* Card 3: Databases */}
        <div className="stack-bento-card">
          <div className="stack-bento-header">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="stack-bento-tag">Persistencia & Rendimiento</span>
          </div>
          <h3 className="stack-bento-title">Bases de Datos & Caché</h3>
          <p className="stack-bento-desc">
            Modelos de datos robustos, integridad relacional y almacenamiento de alta velocidad.
          </p>
          <div className="stack-chips">
            {['PostgreSQL', 'SQL', 'Redis', 'MongoDB'].map(tech => (
              <span key={tech} className="stack-chip">{tech}</span>
            ))}
          </div>
        </div>

        {/* Card 4: Manifesto Quote */}
        <div className="stack-bento-card stack-bento-card-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="radiant-beacon" />
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold">
                EL CRITERIO ANTE TODO
              </span>
            </div>
            <p className="manifesto-quote">
              &ldquo;No llegamos con una herramienta predeterminada. <strong>Analizamos el problema real</strong>, la escala requerida y los recursos para seleccionar la tecnología adecuada.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Radiant Infinite Tech Ticker */}
      <div className="radiant-ticker-wrap relative z-10" aria-hidden="true">
        <div className="radiant-ticker-track">
          {[...technologies, ...technologies, ...technologies].map((tech, idx) => (
            <span key={`${tech}-${idx}`} className="radiant-ticker-item">
              <span>{tech}</span>
              <span className="radiant-ticker-bullet" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );

  return section;
}
