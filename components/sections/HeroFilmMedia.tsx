'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { heroFilm } from '@/content/hero-film';

/** A native poster is complete SSR content; the movie enhances it after paint. */
export function HeroFilmMedia() {
  const { ready, tier } = useMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<'poster' | 'playing' | 'paused'>('poster');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;
    if (tier === 0) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      return;
    }
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
      const source = narrow.matches ? heroFilm.mobileSrc : heroFilm.src;
      if (video.getAttribute('src') !== source) video.src = source;
      void video.play().catch(() => { /* The native poster stays usable if autoplay is unavailable. */ });
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
      video.pause();
    };
  }, [ready, tier]);

  return <>
    {/* Present the small, preloaded poster atomically with the first content
        frame; the movie becomes visible only after a decoded moving frame. */}
    <picture>
      <source media="(min-width:1024px)" srcSet={heroFilm.desktopPoster} />
      <img className="hero-film-poster" src={heroFilm.poster} alt="" aria-hidden="true" width={1280} height={716} fetchPriority="high" decoding="sync" />
    </picture>
    <video ref={videoRef} data-hero-video data-has-frame={tier > 0 && playback !== 'poster'}
      onPlaying={() => setPlayback('playing')} onPause={() => setPlayback(previous => previous === 'poster' ? 'poster' : 'paused')}
      onEmptied={() => setPlayback('poster')} className="hero-film-video" width={1924} height={1076} poster={heroFilm.poster} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
  </>;
}
