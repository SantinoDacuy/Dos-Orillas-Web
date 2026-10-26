/** Videos de fondo del Hero. Escenografía decorativa: nunca un retrato del equipo ni un lugar real de la región.
 * `active` elige cuál se usa ('brand', 'city' o 'river'). `textAfterEnd`: los textos del Hero aparecen al terminar el video. */
const films = {
  /** Original video supplied and explicitly selected by the user on 12/10/2026. Loops. */
  river: {
    sourceReference: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4',
    src: '/visuals/dos-orillas-film.mp4',
    mobileSrc: '/visuals/dos-orillas-film-mobile.mp4',
    srcAv1: null,
    mobileSrcAv1: null,
    poster: '/visuals/hero-film-poster.webp',
    mobilePoster: '/visuals/hero-film-poster.webp',
    desktopPoster: '/visuals/hero-film-poster-desktop.webp',
    width: 1924,
    height: 1076,
    posterWidth: 1280,
    posterHeight: 716,
    loop: true,
    endPoster: null,
    endPosterDesktop: null,
    textAfterEnd: false,
  },
  /** Prueba pedida por el usuario el 26/10/2026: recorrido de 5 s (ciudad → interior → escritorio) que se ve una
   * sola vez y se queda en el último cuadro. Licencia del video sin confirmar. La fuente (VP8 a 2,4 Mbps) se limpió
   * con `scripts/encode-hero-video.mjs`: AV1 donde el navegador lo admite, H.264 en el resto; en celular, un recorte
   * vertical de 720×1280 (la misma zona que muestra object-fit: cover). Los afiches son su primer cuadro.
   * Archivos movidos a assets-archive/hero-video-sources/city-encoded/: para volver a usarlo, copiarlos a public/visuals. */
  city: {
    sourceReference: 'https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/portfolio_hero_bg_zuhahj.webm',
    src: '/visuals/hero-city-1080.h264.mp4',
    mobileSrc: '/visuals/hero-city-mobile.h264.mp4',
    srcAv1: '/visuals/hero-city-1080.av1.mp4',
    mobileSrcAv1: '/visuals/hero-city-mobile.av1.mp4',
    poster: '/visuals/hero-city-poster.webp',
    mobilePoster: '/visuals/hero-city-poster-mobile.webp',
    desktopPoster: '/visuals/hero-city-poster-desktop.webp',
    width: 1920,
    height: 1080,
    posterWidth: 1280,
    posterHeight: 720,
    loop: false,
    endPoster: null,
    endPosterDesktop: null,
    textAfterEnd: false,
  },
  /** Video de la marca generado con IA a partir del logo oficial (26/10/2026, fuente 4K en
   * assets-archive/hero-video-sources/hero-river-source.mp4): el logo, la cámara entra por la «O», cruza el río y llega
   * al estudio. 10 s, se ve una vez; los textos aparecen al terminar. Procesado con
   * `node scripts/encode-hero-video.mjs … hero-river --clean=light --mobile-intro=1.5:2.6:2.2` (en celular abre con el
   * logo entero y se acerca al recorte vertical mientras la cámara entra en la «O»). */
  brand: {
    sourceReference: 'assets-archive/hero-video-sources/hero-river-source.mp4',
    src: '/visuals/hero-river-1080.h264.mp4',
    mobileSrc: '/visuals/hero-river-mobile.h264.mp4',
    srcAv1: '/visuals/hero-river-1080.av1.mp4',
    mobileSrcAv1: '/visuals/hero-river-mobile.av1.mp4',
    poster: '/visuals/hero-river-poster.webp',
    mobilePoster: '/visuals/hero-river-poster-mobile.webp',
    desktopPoster: '/visuals/hero-river-poster-desktop.webp',
    width: 1920,
    height: 1080,
    posterWidth: 1280,
    posterHeight: 720,
    loop: false,
    /** Último cuadro: lo que se ve con movimiento reducido (sin video). */
    endPoster: '/visuals/hero-river-end.webp',
    endPosterDesktop: '/visuals/hero-river-end-desktop.webp',
    textAfterEnd: true,
  },
} as const;

const active: keyof typeof films = 'brand';

export const heroFilm = {
  ...films[active],
  pause: 'PAUSAR VIDEO',
  play: 'REPRODUCIR VIDEO',
} as const;
