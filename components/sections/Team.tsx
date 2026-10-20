'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, Mail, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

interface CharacterSlide {
  id: string;
  name: string;
  role: string;
  tag: string;
  ghost: string;
  shortDesc: string;
  src: string;
  bg: string;
  panel: string;
  accent: string;
}

const CHARACTERS: CharacterSlide[] = [
  {
    id: 'santino',
    name: 'SANTINO DACUY',
    role: 'Frontend, UX & Arquitectura Digital',
    tag: 'CO-FUNDADOR // 01',
    ghost: 'SANTINO',
    shortDesc: 'Diseño y desarrollo de interfaces digitales, experiencia de usuario y arquitectura frontend moderna y reactiva.',
    src: '/personajes/santino.png',
    bg: '#0c1d2e', // Azul noche profundo / medianoche oceánico
    panel: '#132840',
    accent: '#38bdf8',
  },
  {
    id: 'tobias',
    name: 'TOBÍAS CARBALLO',
    role: 'Backend, Sistemas & Arquitectura de Datos',
    tag: 'CO-FUNDADOR // 02',
    ghost: 'TOBÍAS',
    shortDesc: 'Arquitectura de servidores, bases de datos y desarrollo de sistemas a medida para optimizar procesos.',
    src: '/personajes/tobias.png',
    bg: '#082126', // Petróleo oscuro / teal profundo del río
    panel: '#0e2f37',
    accent: '#2dd4bf',
  },
];

const GRAIN_URI = `data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)' opacity='0.08'/></svg>`;

export function Team() {
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  // Resize listener
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload both character images on mount
  React.useEffect(() => {
    CHARACTERS.forEach(char => {
      const img = new Image();
      img.src = char.src;
    });
  }, []);

  // Navigation logic with 650ms lock between the 2 founders
  const navigate = React.useCallback(
    (targetIndex?: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex(prev => (typeof targetIndex === 'number' ? targetIndex : prev === 0 ? 1 : 0));
      window.setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating]
  );

  // Keyboard navigation (ArrowLeft / ArrowRight)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const section = document.getElementById('equipo');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        navigate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const activeChar: CharacterSlide = CHARACTERS[activeIndex] ?? (CHARACTERS[0] as CharacterSlide);

  return (
    <section id="equipo" className="relative w-full" data-editorial="team">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. FULL-VIEWPORT HERO CAROUSEL: FITS 100% IN ONE SCREEN WITH NO SCROLLING
         ───────────────────────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden transition-colors duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-between box-border"
        style={{
          backgroundColor: activeChar.bg,
          fontFamily: "'Inter', sans-serif",
          height: '100dvh',
          minHeight: '580px',
          paddingTop: '4.5rem',
          paddingBottom: '1.25rem',
        }}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-35"
          style={{
            backgroundImage: `url("${GRAIN_URI}")`,
            backgroundSize: '200px 200px',
          }}
          aria-hidden="true"
        />

        {/* Seamless top gradient: blends smoothly from the site's dark navy into the carousel */}
        <div
          className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#071725] via-[#071725]/50 to-transparent pointer-events-none z-[4]"
          aria-hidden="true"
        />

        {/* Seamless bottom gradient: blends smoothly from the carousel into the dossier */}
        <div
          className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#071725] via-[#071725]/50 to-transparent pointer-events-none z-[4]"
          aria-hidden="true"
        />

        {/* Top brand label (sits cleanly right below the 64px navbar) */}
        <div className="relative z-[60] pt-2 sm:pt-3 px-6 sm:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/95">
              DOS ORILLAS // EQUIPO
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-white/80 uppercase tracking-widest">
            <span>2 PERSONAS</span>
            <span className="text-white/40">·</span>
            <span>2 ORILLAS</span>
          </div>
        </div>

        {/* Giant Anton Ghost Text (refined watermark opacity for dark theme) */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2]"
          style={{ top: '15%' }}
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(50px, 14vw, 175px)',
              fontWeight: 900,
              color: 'white',
              opacity: 0.18,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              transition: 'opacity 650ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {activeChar.ghost}
          </span>
        </div>

        {/* Figurines Area: Sized slightly larger as requested while remaining fully visible */}
        <div className="absolute inset-0 z-[15] pointer-events-none">
          {CHARACTERS.map((char, index) => {
            const isCenter = index === activeIndex;

            let roleStyle: React.CSSProperties = {};
            if (isCenter) {
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                transformOrigin: 'bottom center',
                filter: 'blur(0px)',
                opacity: 1,
                zIndex: 25,
                left: '50%',
                height: isMobile ? '64%' : '76%',
                bottom: '1%',
                pointerEvents: 'none',
              };
            } else {
              // Flanking co-founder
              const sideLeft = index === 1 ? (isMobile ? '84%' : '76%') : isMobile ? '16%' : '24%';
              roleStyle = {
                transform: 'translateX(-50%) scale(0.84)',
                transformOrigin: 'bottom center',
                filter: 'blur(1.5px)',
                opacity: 0.65,
                zIndex: 10,
                left: sideLeft,
                height: isMobile ? '44%' : '52%',
                bottom: isMobile ? '20%' : '3%',
                pointerEvents: 'auto',
                cursor: 'pointer',
              };
            }

            return (
              <div
                key={char.id}
                onClick={() => !isCenter && navigate(index)}
                title={!isCenter ? `Ver a ${char.name}` : undefined}
                className="absolute transition-all duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  aspectRatio: '0.6 / 1',
                  willChange: 'transform, filter, opacity, left, bottom',
                  ...roleStyle,
                }}
              >
                <img
                  src={char.src}
                  alt={char.name}
                  draggable={false}
                  className="w-full h-full object-contain object-bottom pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Presentation + Navigation + Discover Link */}
        <div className="relative z-[60] pb-2 sm:pb-3 px-6 sm:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-auto">
          {/* Bottom-Left: Presentation details */}
          <div style={{ maxWidth: '360px' }}>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[10px] font-mono tracking-widest text-white uppercase mb-1">
              <Sparkles className="w-3 h-3 text-white" />
              <span>{activeChar.tag}</span>
            </div>

            <p
              className="text-white font-bold uppercase tracking-wider mb-0.5 text-base sm:text-xl leading-tight"
              style={{ letterSpacing: '0.02em', opacity: 0.95 }}
            >
              {activeChar.name}
            </p>

            <p className="text-xs uppercase font-mono text-white/90 tracking-wider mb-1">
              {activeChar.role}
            </p>

            <p className="hidden sm:block text-xs text-white/85 leading-snug mb-3 font-normal">
              {activeChar.shortDesc}
            </p>

            {/* Navigation buttons: switch between Santino and Tobías */}
            <div className="flex items-center gap-2.5">
              <button
                id="btn-carousel-prev"
                type="button"
                onClick={() => navigate()}
                aria-label="Cambiar personaje"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white flex items-center justify-center text-white bg-transparent hover:scale-105 hover:bg-white/15 active:scale-95 transition-[transform,background-color] duration-150 cursor-pointer shadow-lg backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.25]" />
              </button>
              <button
                id="btn-carousel-next"
                type="button"
                onClick={() => navigate()}
                aria-label="Cambiar personaje"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white flex items-center justify-center text-white bg-transparent hover:scale-105 hover:bg-white/15 active:scale-95 transition-[transform,background-color] duration-150 cursor-pointer shadow-lg backdrop-blur-sm"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.25]" />
              </button>
              <span className="ml-2.5 text-xs font-mono text-white/90 tracking-widest font-semibold">
                0{activeIndex + 1} / 02
              </span>
            </div>
          </div>

          {/* Bottom-Right: Discover detailed dossier */}
          <div className="self-end sm:self-auto">
            <a
              href="#dossier-equipo"
              className="flex items-center gap-2 sm:gap-3 text-white hover:opacity-100 transition-opacity duration-200 uppercase tracking-tight group"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(18px, 2.5vw, 34px)',
                fontWeight: 400,
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textDecoration: 'none',
              }}
            >
              <span>CONOCER MÁS</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center group-hover:translate-y-1 transition-transform duration-200">
                <ArrowDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.25]" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. DETAILED REAL DOSSIERS (HOVER OVER THE CARDS TO REVEAL TOTAL INFO)
          "ya que abajo iran las imagenes reales de ambos y ahi estara la imfo toal
           de cada uno, te posaras sobre la imagen y nos dara la info"
         ───────────────────────────────────────────────────────────────────────────── */}
      <div id="dossier-equipo" className="relative w-full bg-[#071725] py-20 px-6 sm:px-12 lg:px-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/25 text-xs font-mono text-sky-400 uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PERFILES TÉCNICOS & TRAYECTORIA</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>
              DOS MIRADAS. UN MISMO EQUIPO.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
              Posá el cursor sobre cada perfil para descubrir el enfoque profesional, formación académica y stack de trabajo completo.
            </p>
          </div>

          {/* 2 Interactive Cards with Full Hover Dossier Reveal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* ── CARD 01: SANTINO DACUY ── */}
            <div
              tabIndex={0}
              className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#132840] to-[#071725] border border-sky-400/20 hover:border-sky-400/60 focus:border-sky-400/60 transition-all duration-500 shadow-2xl min-h-[560px] cursor-pointer"
            >
              {/* Background Character Showcase */}
              <div className="absolute inset-0 flex items-center justify-center p-8 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-30">
                <img
                  src="/personajes/santino.png"
                  alt="Santino Dacuy"
                  className="w-full h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-[#071725]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>DISPONIBLE PARA PROYECTOS</span>
              </div>

              {/* Default Bottom Bar (Fades out when hovered) */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#071725] via-[#071725]/90 to-transparent transition-opacity duration-300 group-hover:opacity-0 group-focus:opacity-0 pointer-events-none">
                <span className="text-xs font-mono text-sky-400 tracking-widest uppercase">01 // CO-FUNDADOR</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">Santino Dacuy</h3>
                <p className="text-xs text-slate-300 mt-1 font-mono">Analista en Sistemas · Licenciatura en Sistemas en curso</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-sky-300/80 font-mono">
                  <span>Posá el cursor para ver la info total</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* ── HOVER OVERLAY (REVEALS COMPLETE INFO ON HOVER) ── */}
              <div className="absolute inset-0 bg-[#071725]/92 backdrop-blur-lg p-8 flex flex-col justify-between opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus:opacity-100 group-focus:pointer-events-auto transition-all duration-500 transform translate-y-3 group-hover:translate-y-0 group-focus:translate-y-0">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <span className="text-xs font-mono text-sky-400 tracking-widest">ID #01-SD</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>Concepción del Uruguay, AR</span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "'Anton', sans-serif" }}>
                    Santino Dacuy
                  </h3>
                  <p className="text-sky-300 text-xs font-mono mt-1 mb-4">
                    Analista en Sistemas · Licenciatura en Sistemas de Información en curso
                  </p>

                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Co-fundador de Dos Orillas. Especializado en diseño de interfaces de usuario de alto impacto visual, arquitectura de aplicaciones frontend reactivas y optimización integral de la experiencia de usuario.
                  </p>

                  {/* Skills / Tech Stack */}
                  <div className="mb-6">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2.5">
                      ARSENAL & ESPECIALIDADES
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Figma', 'UI/UX Design', 'GSAP', 'SQL', 'Animaciones Web'].map(skill => (
                        <span key={skill} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <a
                    href="mailto:dosorillasestudio@gmail.com"
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase text-sky-400 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Contactar directamente</span>
                  </a>
                  <span className="text-xs font-mono text-slate-400">Entre Ríos, AR</span>
                </div>
              </div>
            </div>

            {/* ── CARD 02: TOBÍAS CARBALLO ── */}
            <div
              tabIndex={0}
              className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#102a3a] to-[#071725] border border-teal-400/20 hover:border-teal-400/60 focus:border-teal-400/60 transition-all duration-500 shadow-2xl min-h-[560px] cursor-pointer"
            >
              {/* Background Character Showcase */}
              <div className="absolute inset-0 flex items-center justify-center p-8 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-30">
                <img
                  src="/personajes/tobias.png"
                  alt="Tobías Carballo"
                  className="w-full h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-[#071725]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>DISPONIBLE PARA PROYECTOS</span>
              </div>

              {/* Default Bottom Bar (Fades out when hovered) */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#071725] via-[#071725]/90 to-transparent transition-opacity duration-300 group-hover:opacity-0 group-focus:opacity-0 pointer-events-none">
                <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">02 // CO-FUNDADOR</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">Tobías Carballo</h3>
                <p className="text-xs text-slate-300 mt-1 font-mono">Analista en Sistemas · Licenciatura en Sistemas en curso</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-teal-300/80 font-mono">
                  <span>Posá el cursor para ver la info total</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* ── HOVER OVERLAY (REVEALS COMPLETE INFO ON HOVER) ── */}
              <div className="absolute inset-0 bg-[#071725]/92 backdrop-blur-lg p-8 flex flex-col justify-between opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus:opacity-100 group-focus:pointer-events-auto transition-all duration-500 transform translate-y-3 group-hover:translate-y-0 group-focus:translate-y-0">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <span className="text-xs font-mono text-teal-400 tracking-widest">ID #02-TC</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span>Concepción del Uruguay, AR</span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "'Anton', sans-serif" }}>
                    Tobías Carballo
                  </h3>
                  <p className="text-teal-300 text-xs font-mono mt-1 mb-4">
                    Analista en Sistemas · Licenciatura en Sistemas de Información en curso
                  </p>

                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Co-fundador de Dos Orillas. Especialista en arquitectura de backend, modelado de bases de datos relacionales y no relacionales, automatizaciones de flujos de trabajo e integraciones de software a medida.
                  </p>

                  {/* Skills / Tech Stack */}
                  <div className="mb-6">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2.5">
                      ARSENAL & ESPECIALIDADES
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Node.js', 'Python', 'PostgreSQL', 'APIs REST', 'Docker', 'Supabase', 'Redis', 'Arquitectura de Datos'].map(skill => (
                        <span key={skill} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <a
                    href="mailto:dosorillasestudio@gmail.com"
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase text-teal-400 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Contactar directamente</span>
                  </a>
                  <span className="text-xs font-mono text-slate-400">Entre Ríos, AR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
