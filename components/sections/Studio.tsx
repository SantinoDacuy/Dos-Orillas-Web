import { studioCopy } from '@/content/site';

export function Studio() {
  return (
    <section
      id="el-estudio"
      className="studio-section editorial-section radiant-section-wrap"
      data-editorial="studio"
      data-theme="navy-deep"
      data-nav="dark"
      aria-labelledby="studio-heading"
      suppressHydrationWarning
    >
      {/* Background Decor: Ambient Glow + Subtle River Wave Curves + Terracotta Transition */}
      <div className="studio-backdrop" aria-hidden="true">
        {/* Soft radial ambient glows behind text */}
        <div className="studio-ambient-glow studio-glow-cyan" />
        <div className="studio-ambient-glow studio-glow-teal" />

        {/* 3 fine static river wave curves (8-10% opacity, pure vector, no blur) */}
        <svg
          className="studio-river-waves"
          viewBox="0 0 1440 600"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M-40,180 C320,120 480,260 840,190 C1120,130 1320,240 1480,210"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.10"
          />
          <path
            d="M-40,320 C260,260 520,380 900,310 C1200,250 1360,340 1480,320"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeOpacity="0.08"
          />
          <path
            d="M-40,460 C360,400 600,520 980,440 C1240,380 1380,460 1480,430"
            stroke="#38bdf8"
            strokeWidth="1"
            strokeOpacity="0.07"
          />
        </svg>

        {/* Seamless transition into the Team Carousel's Terracotta #B85838 */}
        <div className="studio-terracotta-transition" />
      </div>

      <div className="studio-container">
        <div className="studio-grid">
          {/* Left Column (Cols 1-7, sticky in desktop) */}
          <div className="studio-col-left">
            <div className="radiant-badge mb-6">
              <span className="radiant-beacon" />
              <span>{studioCopy.eyebrow}</span>
            </div>

            <h2
              id="studio-heading"
              className="studio-headline"
              aria-label="DOS PERSONAS. DOS ORILLAS. UNA MISMA FORMA DE TRABAJAR."
            >
              <span className="editorial-line-mask studio-headline-line" data-studio-line="1">
                <span className="editorial-line-inner studio-headline-cream" data-editorial-line>
                  DOS PERSONAS.
                </span>
              </span>
              <span className="editorial-line-mask studio-headline-line" data-studio-line="2">
                <span className="editorial-line-inner studio-headline-cream" data-editorial-line>
                  DOS ORILLAS.
                </span>
              </span>
              <span className="editorial-line-mask studio-headline-line" data-studio-line="3">
                <span className="editorial-line-inner studio-headline-cyan" data-editorial-line>
                  UNA MISMA FORMA DE TRABAJAR.
                </span>
              </span>
            </h2>
          </div>

          {/* Right Column (Cols 8-12) */}
          <div className="studio-col-right">
            {/* Frase principal grande con línea vertical cian de 2px a la izquierda */}
            <div className="studio-lead-quote" data-studio-lead>
              {studioCopy.lead}
            </div>

            {/* Párrafo unificado (máx 4 líneas en desktop, max-width ~46ch) */}
            <p className="studio-paragraph" data-studio-paragraph>
              {studioCopy.paragraph}
            </p>
          </div>

          {/* Puente entre orillas: Cruza el ancho del contenedor debajo de la narrativa */}
          <div className="studio-bridge-wrapper" data-studio-bridge>
            <div className="studio-bridge-container">
              <svg
                className="studio-bridge-svg"
                viewBox="0 0 1000 32"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Subtle base track */}
                <line x1="16" y1="16" x2="984" y2="16" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
                {/* Dynamic animated line with scroll scrub */}
                <line
                  className="studio-bridge-path"
                  x1="16"
                  y1="16"
                  x2="984"
                  y2="16"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="968"
                  strokeDashoffset="968"
                />
                {/* Left shore node */}
                <circle cx="16" cy="16" r="4" fill="#38bdf8" />
                <circle cx="16" cy="16" r="8" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
                {/* Right shore node */}
                <circle cx="984" cy="16" r="4" fill="#38bdf8" />
                <circle cx="984" cy="16" r="8" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
              </svg>

              {/* Centered coordinates badge over the bridge */}
              <div className="studio-bridge-pin">
                <svg className="studio-pin-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" fill="#38bdf8" />
                  <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                </svg>
                <span className="studio-pin-coords">{studioCopy.coordinates}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
