import { heroCopy } from '@/content/site';
import { heroFilm } from '@/content/hero-film';
import { preload } from 'react-dom';
import { HeroFilmMedia } from './HeroFilmMedia';
import { Logo } from '@/components/layout/Logo';

export function Hero() {
  preload(heroFilm.poster, { as: 'image', fetchPriority: 'high' });
  return (
    <section
      id="estudio"
      className="hero-scene hero-film"
      data-theme="navy-deep"
      data-scene="hero"
      data-hero-variant="film"
      aria-labelledby="hero-title"
    >
      <div className="hero-stage hero-film-shell">
        <link
          rel="preload"
          as="image"
          href={heroFilm.desktopPoster}
          media="(min-width:1024px)"
          fetchPriority="high"
        />
        <HeroFilmMedia />
        <div className="hero-film-shade" aria-hidden="true" />
        <div className="hero-bottom-feather" aria-hidden="true" />

        <div className="hero-film-content">
          <div className="hero-brand-block">
            <h1 id="hero-title" className="hero-brand-heading" aria-label={heroCopy.title} tabIndex={-1}>
              <Logo horizontal light eager className="hero-brand-logo" />
            </h1>

            <div className="hero-narrative">
              <div className="hero-philosophy">
                <p className="hero-first">{heroCopy.philosophyLines[0]}</p>
                <p className="hero-second">{heroCopy.philosophyLines[1]}</p>
              </div>
              <p className="hero-description">{heroCopy.description}</p>
            </div>

            <div className="hero-actions">
              <a className="btn btn-primary" href={heroCopy.primaryCta.href}>
                <span>Contanos qué querés resolver</span>
                <span className="btn-icon" aria-hidden="true">→</span>
              </a>
              <a className="btn btn-ghost" href={heroCopy.secondaryCta.href}>
                <span>Ver proyectos</span>
                <span className="btn-icon" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
