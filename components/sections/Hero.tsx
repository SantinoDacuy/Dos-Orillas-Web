import { heroCopy, siteConfig } from '@/content/site';
import { heroFilm } from '@/content/hero-film';
import { preload } from 'react-dom';
import { HeroFilmMedia } from './HeroFilmMedia';
import { Logo } from '@/components/layout/Logo';

export function Hero() {
  preload(heroFilm.mobilePoster, { as: 'image', fetchPriority: 'high', media: '(max-width:767px)' });
  preload(heroFilm.poster, { as: 'image', fetchPriority: 'high', media: '(min-width:768px) and (max-width:1023px)' });
  return (
    <section
      id="estudio"
      className="hero-scene hero-film"
      data-theme="navy-deep"
      data-scene="hero"
      data-hero-variant="film"
      data-text-after={heroFilm.textAfterEnd ? 'video' : undefined}
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
        {/* Grano de película: disimula la compresión del video sin tocar el archivo. */}
        <div className="hero-film-grain" aria-hidden="true" />
        <div className="hero-film-shade" aria-hidden="true" />
        <div className="hero-bottom-feather" aria-hidden="true" />

        <div className="hero-film-content">
          <div className="hero-brand-block">
            <h1 id="hero-title" className="hero-brand-heading" aria-label={heroCopy.title} tabIndex={-1}>
              <Logo horizontal light eager className="hero-brand-logo" />
            </h1>

            {/* La frase de la marca es el titular visual; el logo firma arriba (el h1 lo nombra). */}
            <p className="hero-statement">
              <span className="hero-first">{heroCopy.philosophyLines[0]}</span>{' '}
              <span className="hero-second">{heroCopy.philosophyLines[1]}</span>
            </p>
            <p className="hero-description">{heroCopy.description}</p>

            <div className="hero-actions">
              <a className="btn btn-primary" href={heroCopy.primaryCta.href}>
                <span>{heroCopy.primaryCta.label}</span>
                <span className="btn-icon" aria-hidden="true">→</span>
              </a>
              <a className="btn btn-ghost" href={heroCopy.secondaryCta.href}>
                <span>{heroCopy.secondaryCta.label}</span>
                <span className="btn-icon" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <p className="hero-meta mono" aria-hidden="true">{siteConfig.location.label}</p>
        </div>
      </div>
    </section>
  );
}
