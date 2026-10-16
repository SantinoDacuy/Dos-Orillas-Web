'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import Link from 'next/link';
import Image from 'next/image';
import { projects as defaultProjects, type Project } from '@/data/projects';

export interface ParallaxComponentProps {
  title?: string;
  badge?: string;
  subtitle?: string;
  items?: readonly Project[];
  className?: string;
}

export function ParallaxComponent({
  title = "PROYECTOS",
  badge = "03 // CASOS SELECCIONADOS",
  subtitle = "Soluciones digitales pensadas desde el problema real.",
  items = defaultProjects,
  className = "",
}: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    let tl: gsap.core.Timeline | null = null;
    if (triggerElement) {
      tl = gsap.timeline({
        scrollTrigger: {
          id: "parallax-layers-trigger",
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 },
      ];

      layers.forEach((layerObj, idx) => {
        tl?.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none",
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    let localLenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    if (typeof window !== 'undefined') {
      // Check if global Lenis already running
      if ((window as unknown as { __lenis?: Lenis }).__lenis) {
        ScrollTrigger.update();
      } else {
        localLenis = new Lenis();
        localLenis.on('scroll', ScrollTrigger.update);
        tick = (time: number) => {
          localLenis?.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }
    }

    return () => {
      if (tl) {
        tl.scrollTrigger?.kill();
        tl.kill();
      }
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      if (localLenis && tick) {
        gsap.ticker.remove(tick);
        localLenis.destroy();
      }
    };
  }, []);

  return (
    <div id="proyectos" className={`parallax ${className}`} ref={parallaxRef} data-scene="proyectos" data-theme="navy-deep">
      {/* ── Parallax 3D Layered Header ── */}
      <section className="parallax__header" aria-labelledby="parallax-heading">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div className="parallax__fade-top" />
          
          <div data-parallax-layers className="parallax__layers">
            {/* Layer 1: Background Twilight Sky & Stars (Moves slowest: 70%) */}
            <img
              src="/images/parallax/layer-1.webp"
              loading="eager"
              data-parallax-layer="1"
              alt=""
              className="parallax__layer-img"
            />

            {/* Layer 2: Distant Mountain Peaks (Moves 55%) */}
            <img
              src="/images/parallax/layer-2.webp"
              loading="eager"
              data-parallax-layer="2"
              alt=""
              className="parallax__layer-img"
            />

            {/* Layer 3: Title & Badge sitting dynamically BETWEEN mountains and foreground (Moves 40%) */}
            <div data-parallax-layer="3" className="parallax__layer-title">
              <div className="parallax__badge mono">
                <span className="parallax__badge-dot" aria-hidden="true" />
                <span>{badge}</span>
              </div>
              <h2 id="parallax-heading" className="parallax__title">{title}</h2>
              <p className="parallax__subtitle">{subtitle}</p>
            </div>

            {/* Layer 4: Foreground Ridge & Silhouette (Moves fastest: 10%, in front of title) */}
            <img
              src="/images/parallax/layer-4.webp"
              loading="eager"
              data-parallax-layer="4"
              alt=""
              className="parallax__layer-img"
            />
          </div>

          <div className="parallax__fade" />
        </div>
      </section>

      {/* ── Pure Dark/Navy Section (#071725) holding our projects ── */}
      <section className="parallax__content" aria-label="Casos de Estudio">
        <div className="parallax-projects-shell">
          <header className="parallax-projects-intro">
            <span className="parallax-projects-tagline mono">TRABAJO SELECCIONADO</span>
            <h3 className="parallax-projects-lead">
              Soluciones creadas para responder a problemas concretos.
            </h3>
            <p className="parallax-projects-desc">
              Antes de escribir una línea de código o elegir una tecnología, analizamos el negocio.
              Acá podés explorar algunos de los casos y sistemas que desarrollamos.
            </p>
          </header>

          <div className="parallax-projects-grid">
            {items.map((project, index) => {
              const num = String(index + 1).padStart(2, '0');
              const coverSrc = project.cover.src || `/projects/${project.slug}/cover.webp`;

              return (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="parallax-project-card"
                  data-cursor="ver"
                >
                  <div className="parallax-project-media-wrap">
                    <Image
                      src={coverSrc}
                      alt={project.title}
                      width={project.cover.width || 1200}
                      height={project.cover.height || 750}
                      className="parallax-project-img"
                      loading="lazy"
                    />
                    <div className="parallax-project-media-overlay" aria-hidden="true" />
                  </div>

                  <div className="parallax-project-info">
                    <div className="parallax-project-meta">
                      <span className="parallax-project-num mono">
                        <span>PROYECTO</span>
                        <span>{num}</span>
                      </span>
                      <span className="parallax-project-category mono">
                        {project.categoryLabel}
                      </span>
                    </div>

                    <h4 className="parallax-project-title">
                      {project.title}
                    </h4>

                    <p className="parallax-project-desc">
                      {project.description}
                    </p>

                    {project.technologies.length > 0 && (
                      <div className="parallax-project-tags">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span key={tech} className="parallax-project-tag mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="parallax-project-cta mono">
                      <span>VER PROYECTO</span>
                      <span className="parallax-project-arrow" aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom invitation and View All */}
          <footer className="parallax-projects-footer">
            <div className="parallax-footer-text">
              <h4>¿Tenés un proyecto o una idea?</h4>
              <p>Hablamos sobre tu negocio y encontramos la herramienta adecuada.</p>
            </div>
            <div className="parallax-footer-actions">
              <Link href="#contacto" className="hero-btn-primary">
                <span>Contanos qué querés resolver</span>
                <span className="hero-btn-icon" aria-hidden="true">→</span>
              </Link>
              <Link href="/projects" className="hero-btn-secondary">
                <span>Ver todos los proyectos ({String(items.length).padStart(2, '0')})</span>
                <span className="hero-btn-icon" aria-hidden="true">↗</span>
              </Link>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
