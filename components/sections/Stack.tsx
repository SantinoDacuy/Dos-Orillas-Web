'use client';

import * as React from 'react';
import { 
  MonitorSmartphone, 
  Server, 
  Database as LucideDatabase, 
  Search, 
  TrendingUp, 
  Layers 
} from 'lucide-react';
import { TechIcon, TECH_METADATA } from '@/components/ui/tech-icons';

interface CardData {
  id: 'interface' | 'server' | 'data';
  eyebrow: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  technologies: readonly string[];
}

const STACK_CARDS: readonly CardData[] = [
  {
    id: 'interface',
    eyebrow: '01 // INTERFACES & WEB',
    title: 'Frontend & Experiencia',
    desc: 'Interfaces interactivas, renderizado optimizado y sistemas de diseño consistentes.',
    icon: <MonitorSmartphone size={20} strokeWidth={1.75} aria-hidden="true" />,
    technologies: ['Next.js', 'React', 'TypeScript', 'JavaScript', 'GSAP', 'Tailwind', 'Figma'],
  },
  {
    id: 'server',
    eyebrow: '02 // SERVIDORES & LÓGICA',
    title: 'Backend & Arquitectura',
    desc: 'APIs REST, pipelines de datos y entornos contenerizados listos para producción.',
    icon: <Server size={20} strokeWidth={1.75} aria-hidden="true" />,
    technologies: ['Node.js', 'Python', 'APIs REST', 'Supabase', 'Docker', 'AWS'],
  },
  {
    id: 'data',
    eyebrow: '03 // PERSISTENCIA & RENDIMIENTO',
    title: 'Bases de Datos & Caché',
    desc: 'Modelos de datos robustos, integridad relacional y almacenamiento de alta velocidad.',
    icon: <LucideDatabase size={20} strokeWidth={1.75} aria-hidden="true" />,
    technologies: ['PostgreSQL', 'SQL', 'Redis', 'MongoDB'],
  },
];

export function Stack() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [scrollYOffset, setScrollYOffset] = React.useState(0);

  // Entrance observer & visibility observer
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parallax scroll scrub for the isometric stack illustration (pure transform, translateY <= 24px)
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          // Calculate progress through viewport
          if (rect.top < windowHeight && rect.bottom > 0) {
            const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
            // Range from -12px to +12px (max delta 24px)
            const offset = (progress - 0.5) * 24;
            setScrollYOffset(Math.max(-12, Math.min(12, offset)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="herramientas"
      ref={sectionRef}
      className="stack-section editorial-section radiant-section-wrap"
      data-editorial="stack"
      data-theme="navy-deep"
      data-nav="dark"
      data-revealed={isRevealed ? 'true' : 'false'}
      data-visible={isVisible ? 'true' : 'false'}
      aria-labelledby="stack-heading"
      suppressHydrationWarning
    >
      {/* Ambient background glows behind content, strictly pointer-events: none */}
      <div 
        className="radiant-ambient-glow radiant-glow-teal" 
        style={{ width: '550px', height: '550px', top: '10%', left: '-5%', pointerEvents: 'none' }} 
        aria-hidden="true" 
      />
      <div 
        className="radiant-ambient-glow radiant-glow-cyan" 
        style={{ width: '600px', height: '600px', bottom: '0%', right: '-5%', pointerEvents: 'none' }} 
        aria-hidden="true" 
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          PARTE A — TITULAR & ILUSTRACIÓN ISOMÉTRICA
         ───────────────────────────────────────────────────────────────────────────── */}
      <header className="stack-header relative z-10">
        <div className="stack-header-grid">
          {/* Left Column: Eyebrow + Titular + Subtitle */}
          <div className="stack-header-text">
            <div className="radiant-badge mb-6">
              <span className="radiant-beacon" />
              <span>04 · Criterio & Stack</span>
            </div>

            <h2 id="stack-heading" className="stack-headline">
              <span className="stack-headline-mask">
                <span className="stack-headline-inner stack-headline-serif">
                  LAS HERRAMIENTAS CAMBIAN.
                </span>
              </span>
              <span className="stack-headline-mask">
                <span className="stack-headline-inner stack-headline-sans">
                  EL CRITERIO NO.
                </span>
              </span>
            </h2>

            <p className="stack-description mt-6">
              Elegimos tecnología en función de lo que haya que resolver.
            </p>
          </div>

          {/* Right Column: Isometric 3-Layer Stack Illustration (≥ 1024px) */}
          <div 
            className="stack-isometric-wrap" 
            aria-hidden="true"
            style={{ transform: `translateY(${scrollYOffset}px)` }}
          >
            <svg
              className="stack-isometric-svg"
              viewBox="0 0 340 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1: INTERFAZ (Top layer, Y: ~25-95) */}
              <g className="stack-iso-layer" data-iso-layer="interface">
                {/* Top Face */}
                <path
                  d="M170 20 L275 64 L170 108 L65 64 Z"
                  className="stack-iso-face-top"
                />
                {/* Left Side Extrusion */}
                <path
                  d="M65 64 L170 108 L170 119 L65 75 Z"
                  className="stack-iso-face-left"
                />
                {/* Right Side Extrusion */}
                <path
                  d="M275 64 L170 108 L170 119 L275 75 Z"
                  className="stack-iso-face-right"
                />
                {/* Internal UI Grid Wireframe */}
                <path
                  d="M100 50 L170 79 L240 50"
                  className="stack-iso-detail"
                />
                <path
                  d="M135 64.5 L170 79 L205 64.5"
                  className="stack-iso-detail"
                />
                <circle cx="170" cy="52" r="3" className="stack-iso-node" />
                <text x="170" y="38" className="stack-iso-label">INTERFAZ</text>
              </g>

              {/* Connector dots between layers 1 & 2 */}
              <line x1="170" y1="122" x2="170" y2="135" className="stack-iso-connector" strokeDasharray="2 3" />

              {/* Layer 2: SERVIDOR (Middle layer, Y: ~85-155) */}
              <g className="stack-iso-layer" data-iso-layer="server">
                {/* Top Face */}
                <path
                  d="M170 78 L275 122 L170 166 L65 122 Z"
                  className="stack-iso-face-top"
                />
                {/* Left Side Extrusion */}
                <path
                  d="M65 122 L170 166 L170 177 L65 133 Z"
                  className="stack-iso-face-left"
                />
                {/* Right Side Extrusion */}
                <path
                  d="M275 122 L170 166 L170 177 L275 133 Z"
                  className="stack-iso-face-right"
                />
                {/* Server Circuit / API Nodes Wireframe */}
                <path
                  d="M115 101 L170 124 L225 101"
                  className="stack-iso-detail"
                />
                <line x1="140" y1="112" x2="140" y2="136" className="stack-iso-detail" />
                <line x1="200" y1="112" x2="200" y2="136" className="stack-iso-detail" />
                <circle cx="140" cy="112" r="2.5" className="stack-iso-node" />
                <circle cx="200" cy="112" r="2.5" className="stack-iso-node" />
                <text x="170" y="96" className="stack-iso-label">SERVIDOR</text>
              </g>

              {/* Connector dots between layers 2 & 3 */}
              <line x1="170" y1="180" x2="170" y2="193" className="stack-iso-connector" strokeDasharray="2 3" />

              {/* Layer 3: DATOS (Bottom layer, Y: ~135-215) */}
              <g className="stack-iso-layer" data-iso-layer="data">
                {/* Top Face */}
                <path
                  d="M170 136 L275 180 L170 224 L65 180 Z"
                  className="stack-iso-face-top"
                />
                {/* Left Side Extrusion */}
                <path
                  d="M65 180 L170 224 L170 235 L65 191 Z"
                  className="stack-iso-face-left"
                />
                {/* Right Side Extrusion */}
                <path
                  d="M275 180 L170 224 L170 235 L275 191 Z"
                  className="stack-iso-face-right"
                />
                {/* Data Persistence Rings Wireframe */}
                <ellipse cx="170" cy="178" rx="45" ry="16" className="stack-iso-detail" />
                <ellipse cx="170" cy="188" rx="35" ry="12" className="stack-iso-detail" />
                <text x="170" y="154" className="stack-iso-label">DATOS</text>
              </g>
            </svg>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PARTE B & C — CARDS CON LOGOS REALES & CONECTORES FLUIDOS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="stack-cards-grid relative z-10">
        {STACK_CARDS.map((card, cardIndex) => (
          <React.Fragment key={card.id}>
            <article 
              className="stack-card" 
              data-stack-card={card.id} 
              style={{ '--card-index': cardIndex } as React.CSSProperties}
            >
              <div className="stack-card-inner">
                <div className="stack-card-header">
                  <div className="stack-card-icon-tile" aria-hidden="true">
                    {card.icon}
                  </div>
                  <span className="stack-card-eyebrow">{card.eyebrow}</span>
                </div>

                <h3 className="stack-card-title">{card.title}</h3>
                <p className="stack-card-desc">{card.desc}</p>

                <ul className="stack-chips-list" aria-label={`Tecnologías de ${card.title}`}>
                  {card.technologies.map((tech, chipIdx) => {
                    const brand = TECH_METADATA[tech] ?? { brandColor: '#38bdf8' };
                    return (
                      <li 
                        key={tech} 
                        className="stack-chip-item"
                        style={{ '--chip-index': chipIdx, '--brand-color': brand.brandColor } as React.CSSProperties}
                      >
                        <span className="stack-tech-chip">
                          <span className="stack-tech-icon" aria-hidden="true">
                            <TechIcon name={tech} />
                          </span>
                          <span className="stack-tech-name">{tech}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>

            {/* Dynamic Connector between cards (Desktop ≥ 1024px) */}
            {cardIndex < STACK_CARDS.length - 1 && (
              <div className="stack-grid-connector" aria-hidden="true">
                <div className="stack-connector-track">
                  <div className="stack-connector-pulse" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>


      {/* ─────────────────────────────────────────────────────────────────────────────
          PARTE D — "EL CRITERIO ANTE TODO" (FRANJA LIVIANA, SIN MARQUEE NI CAJA PESADA)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="stack-criterion-strip relative z-10">
        <div className="stack-criterion-inner">
          {/* Eyebrow mono cian */}
          <div className="flex items-center gap-2 mb-3">
            <span className="radiant-beacon" />
            <span className="stack-criterion-eyebrow">
              EL CRITERIO ANTE TODO
            </span>
          </div>

          {/* Frase principal destacada */}
          <p className="stack-criterion-headline">
            No llegamos con una herramienta predeterminada.
          </p>

          {/* Desglose de análisis con 3 ítems con ícono */}
          <div className="stack-criterion-flow">
            <span className="stack-criterion-prefix">Analizamos</span>

            <div className="stack-criterion-items">
              {/* Ítem 1: El problema real */}
              <div className="stack-criterion-badge">
                <span className="stack-criterion-badge-icon" aria-hidden="true">
                  <Search size={14} strokeWidth={2} />
                </span>
                <span className="stack-criterion-badge-text">El problema real</span>
              </div>

              <span className="stack-criterion-comma">,</span>

              {/* Ítem 2: La escala requerida */}
              <div className="stack-criterion-badge">
                <span className="stack-criterion-badge-icon" aria-hidden="true">
                  <TrendingUp size={14} strokeWidth={2} />
                </span>
                <span className="stack-criterion-badge-text">La escala requerida</span>
              </div>

              <span className="stack-criterion-and">y</span>

              {/* Ítem 3: Los recursos */}
              <div className="stack-criterion-badge">
                <span className="stack-criterion-badge-icon" aria-hidden="true">
                  <Layers size={14} strokeWidth={2} />
                </span>
                <span className="stack-criterion-badge-text">Los recursos</span>
              </div>
            </div>

            <span className="stack-criterion-suffix">
              para seleccionar la tecnología adecuada.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
