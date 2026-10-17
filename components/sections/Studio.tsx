import { studioCopy } from '@/content/site';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

export function Studio() {
  const section = (
    <section
      id="el-estudio"
      className="studio-section editorial-section radiant-section-wrap"
      data-editorial="studio"
      data-theme="navy-deep"
      data-nav="dark"
      aria-labelledby="studio-heading"
    >
      {/* Radiant ambient light sources */}
      <div className="radiant-ambient-glow radiant-glow-cyan" style={{ width: '650px', height: '650px', top: '-10%', left: '-10%' }} aria-hidden="true" />
      <div className="radiant-ambient-glow radiant-glow-teal" style={{ width: '500px', height: '500px', bottom: '10%', right: '-5%' }} aria-hidden="true" />

      <div className="studio-radiant-container studio-split">
        <header className="studio-sticky">
          <div className="radiant-badge mb-6">
            <span className="radiant-beacon" />
            <span>01 · {studioCopy.title}</span>
          </div>

          <h2 id="studio-heading" className="studio-headline">
            <EditorialLines lines={studioCopy.headline} accentIndex={2} />
          </h2>

          <div className="mt-8 flex items-center gap-3 text-xs font-mono tracking-wider text-slate-400">
            <span className="inline-block w-8 h-[1px] bg-sky-400/50" />
            <span>32°29′S 58°14′W · CONCEPCIÓN DEL URUGUAY</span>
          </div>
        </header>

        <div className="studio-reading">
          {/* Luminous Lead Manifesto Card */}
          <div className="studio-lead-card w-full">
            <p className="studio-lead-quote" data-editorial-words>
              {studioCopy.lead.split(/\s+/).map((word, index) => (
                <span key={`${index}-${word}`}>
                  <span data-editorial-word>{word}</span>{' '}
                </span>
              ))}
            </p>
          </div>

          {/* Context paragraphs with rich styling */}
          <div className="studio-paragraphs text-slate-300">
            <p>{studioCopy.paragraphs[0]}</p>
            <p>{studioCopy.paragraphs[1]}</p>
          </div>

          {/* Radiant 3-Phase Methodology Grid */}
          <div className="w-full">
            <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Nuestra Metodología de Trabajo</span>
            </div>
            
            <p className="text-base text-slate-300 mb-6 italic font-serif">
              &ldquo;No llegamos con una herramienta definida.&rdquo;
            </p>

            <div className="methodology-grid">
              {/* Step 1 */}
              <div className="methodology-card">
                <div className="methodology-top">
                  <span className="methodology-number">01</span>
                  <div className="methodology-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="methodology-title">Escuchamos.</h4>
                  <p className="methodology-desc">
                    Entendemos la realidad y el funcionamiento de tu negocio, diagnosticando antes de prescribir.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="methodology-card">
                <div className="methodology-top">
                  <span className="methodology-number">02</span>
                  <div className="methodology-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m4.93 4.93 4.24 4.24" />
                      <path d="m14.83 9.17 4.24-4.24" />
                      <path d="m14.83 14.83 4.24 4.24" />
                      <path d="m9.17 14.83-4.24 4.24" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="methodology-title">Analizamos.</h4>
                  <p className="methodology-desc">
                    Diseñamos la arquitectura y estrategia tecnológica óptima, priorizando simpleza y valor tangible.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="methodology-card">
                <div className="methodology-top">
                  <span className="methodology-number">03</span>
                  <div className="methodology-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="methodology-title">Y después construimos.</h4>
                  <p className="methodology-desc">
                    Desarrollamos soluciones sólidas, escalables y a medida con tecnología moderna y alto criterio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return section;
}
