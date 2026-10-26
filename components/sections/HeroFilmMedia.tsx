'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { heroFilm } from '@/content/hero-film';

/** A native poster is complete SSR content; the movie enhances it after paint. */
export function HeroFilmMedia() {
  const { ready, tier } = useMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<'poster' | 'playing' | 'paused' | 'ended'>('poster');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;
    // Textos diferidos: aparecen cuando el video termina, o antes si no va a poder verse entero.
    const hero = video.closest<HTMLElement>('.hero-film');
    const reveal = () => { if (hero && hero.dataset.intro !== 'done') hero.dataset.intro = 'done'; };
    if (!heroFilm.textAfterEnd || video.ended) reveal();
    if (tier === 0) {
      reveal();
      video.pause();
      video.removeAttribute('src');
      video.load();
      return;
    }
    // Si el usuario baja, navega con el teclado o el video no arranca a tiempo, el texto no espera.
    const onScroll = () => { if (window.scrollY > 40) reveal(); };
    const stall = window.setTimeout(() => { if (video.paused || video.readyState < 3) reveal(); }, 4500);
    window.addEventListener('scroll', onScroll, { passive: true });
    hero?.addEventListener('focusin', reveal);
    video.addEventListener('ended', reveal);
    video.addEventListener('error', reveal);
    let alive = true;
    let visible = false;
    let painted = false;
    let idle = 0;
    let timer = 0;
    const narrow = matchMedia('(max-width:767px)');
    let paintObserver: PerformanceObserver | undefined;
    const play = () => {
      idle = 0;
      timer = 0;
      if (!alive || !visible || !painted || document.hidden) return;
      // Un video sin bucle se ve una sola vez: al volver al Hero se queda en su último cuadro.
      if (!heroFilm.loop && video.ended) return;
      // AV1 pesa menos con la misma calidad; donde no se decodifica, H.264.
      const av1 = video.canPlayType('video/mp4; codecs="av01.0.08M.08"') === 'probably';
      const source = narrow.matches ? (av1 && heroFilm.mobileSrcAv1) || heroFilm.mobileSrc : (av1 && heroFilm.srcAv1) || heroFilm.src;
      if (video.getAttribute('src') !== source) video.src = source;
      void video.play().catch(() => { reveal(); /* The native poster stays usable if autoplay is unavailable. */ });
    };
    const schedule = () => {
      if (!alive || !painted || !visible || idle || timer) return;
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(play, { timeout: 1500 });
      else timer = window.setTimeout(play, 0);
    };
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else schedule();
    };
    document.addEventListener('visibilitychange', onVisibility);
    narrow.addEventListener('change', schedule);
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) schedule();
      else video.pause();
    }, { threshold: .05 });
    observer.observe(video);
    const afterPaint = () => {
      timer = 0;
      painted = true;
      paintObserver?.disconnect();
      schedule();
    };
    if (performance.getEntriesByType('paint').some(entry => entry.name === 'first-contentful-paint')) afterPaint();
    else if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      paintObserver = new PerformanceObserver(list => {
        if (list.getEntries().some(entry => entry.name === 'first-contentful-paint')) afterPaint();
      });
      paintObserver.observe({ type: 'paint', buffered: true });
    } else timer = window.setTimeout(afterPaint, 0);
    return () => {
      alive = false;
      if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      paintObserver?.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      narrow.removeEventListener('change', schedule);
      window.clearTimeout(stall);
      window.removeEventListener('scroll', onScroll);
      hero?.removeEventListener('focusin', reveal);
      video.removeEventListener('ended', reveal);
      video.removeEventListener('error', reveal);
      video.pause();
    };
  }, [ready, tier]);

  return <>
    {/* Present the small, preloaded poster atomically with the first content
        frame; the movie becomes visible only after a decoded moving frame. */}
    <picture>
      {/* Con movimiento reducido no hay video: se muestra directamente su último cuadro. */}
      {heroFilm.endPosterDesktop && <source media="(prefers-reduced-motion: reduce) and (min-width:1024px)" srcSet={heroFilm.endPosterDesktop} />}
      {heroFilm.endPoster && <source media="(prefers-reduced-motion: reduce)" srcSet={heroFilm.endPoster} />}
      <source media="(min-width:1024px)" srcSet={heroFilm.desktopPoster} />
      <source media="(max-width:767px)" srcSet={heroFilm.mobilePoster} />
      <img className="hero-film-poster" src={heroFilm.poster} alt="" aria-hidden="true" width={heroFilm.posterWidth} height={heroFilm.posterHeight} fetchPriority="high" decoding="sync" />
    </picture>
    <video ref={videoRef} data-hero-video data-has-frame={tier > 0 && playback !== 'poster'}
      onPlaying={() => setPlayback('playing')} onPause={() => setPlayback(previous => previous === 'poster' || previous === 'ended' ? previous : 'paused')}
      onEnded={() => setPlayback('ended')} data-playback={playback}
      onEmptied={() => setPlayback('poster')} className="hero-film-video" width={heroFilm.width} height={heroFilm.height} poster={heroFilm.poster} muted loop={heroFilm.loop} playsInline preload="none" aria-hidden="true" tabIndex={-1} />
  </>;
}
